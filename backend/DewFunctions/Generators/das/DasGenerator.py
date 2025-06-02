# Distributed action scheduler (DAS) generator

import os.path
import sys
import re

cwd = os.path.dirname(os.path.realpath(__file__))
parentDir = os.path.abspath(os.path.join(cwd, os.pardir))
sys.path.insert(0, parentDir)
from generator import Generator

class DasGenerator(Generator):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args,  **kwargs)
        self.cflags = dict()
        # Dictionary of special functions with regex
        # and expansions
        self.special = {
            '(?:\s|^)(expIP)(?:\s|$|\:)': 'inet ip exp',
            '(?:\s|^)(ctlIP)(?:\s|$|\:)': 'inet ip ctl',
            '(?:\s|^)(expeth)(?:\s|$|\:)': 'inet eth exp',
            '(?:\s|^)(expIP\(([a-zA-Z0-9_\-]+)\))(?:\s|$|\:)': 'inet ip exp $node',
            '(?:\s|^)(expeth\(([a-zA-Z0-9_\-]+)\))(?:\s|$|\:)': 'inet eth exp $node',
            '(?:\s|^)(IP\(([a-zA-Z0-9_\-]+)\))(?:\s|$|\:)': 'inet fip exp $node',
            '(?:\s|^|\/)(epoch)(?:\s|$|\/|\.)': 'epoch',
            '(?:\s|^|\/)(pid)(?:\s|$|\/|\.)': 'pexp -p',
            '(?:\s|^|\/)(eid)(?:\s|$|\/|\.)': 'pexp -e',
            '(?:\s|^|\/)(nid)(?:\s|$|\/|\.)': 'pexp -n',
        }
        self.evars = dict()


    def generate(self, mode=None):
        super().generate(mode)
        self.collectLabels()
        self.collectNum()
        self.generateDew()
        self.generateArgParse()
        self.generatePreamble()        
        self.collectConds()        
        self.generateActions()
        self.generatePostamble()

    def collectLabels(self):
        self.labels = dict()
        for s in self.scenario_parsed:
            self.labels[s[-1]] = 1

    def collectNum(self):
        self.num = dict()
        for c in self.constraints_parsed:
            if c[0] == 'config':
                for i in range(0, len(c[2]), 2):
                    if c[2][i] == 'num':
                        for x in c[1]:
                            if int(c[2][i+1]) > 1:
                                self.num[x] = int(c[2][i+1])
            
    def generateActions(self):
        
        sid = 0
        count = dict()
        # Collect all actors
        for s in self.scenario_parsed:
            self.actors[s[1][0]] = 1
            
        started = False
        for s in self.scenario_parsed:
            label = s[-1]
            clist = s[0]

            if label is not None and not started:
                self.tmp[label] = ""
                started = True

            
            # only one actor and one action
            actor = s[1][0]
            action = s[2][0]
            
            # this is the event we emit
            if s[3] is not None:
                event = s[3][0]
            else:
                event = None

            if s[4] is not None:
                wait = s[4]
                # variable
                r1 = re.findall(r"\$\w+\d*", s[4])
                if len(r1) > 0:
                    isnum = False
                else:
                    isnum = True
            else:
                wait = None

            precmd = "";

            if clist is not None and len(clist)>0:
                for cond in clist:
                    if cond in count.keys():
                        if cond in self.conditions:
                            precmd += "when " + self.conditions[cond][0] + "-" + str(count[cond]) + " " 
                    else:
                        for c in count:
                            r1 = re.findall(cond+'\.\d+',c)
                            if len(r1) > 0:
                                if cond in self.conditions:
                                    precmd += "when "+self.conditions[cond][0] + "-" + str(count[c]) + " "  
            else:
                precmd += "when none "

                                
            if wait is not None:
                precmd += "wait "+str(wait)+" "
            else:
                precmd += "wait none "
                                    
            if action in self.bindings_parsed:                
                words = re.split(' |\(|\)', self.bindings_parsed[action])
                if (actor in self.num.keys()):
                    for i in range(0,self.num[actor]):
                        found = False
                        for w in words:
                            if w in self.actors and w in self.num.keys():
                                found = True
                                for j in range(0,self.num[w]):
                                    self.generateCmd(actor,i+1,w,j+1,sid, action, label, precmd, wait)
                                    if (event is not None):
                                        count[event + "." + str(i+1)+"."+str(j+1)] = sid
                                    sid += 1
                        if not found:
                            self.generateCmd(actor,i+1,None,None,sid,action, label, precmd, wait)
                            if (event is not None):
                                count[event+"."+str(i+1)] = sid
                            sid += 1
                else:
                    found = False
                    for w in words:
                        if w in self.actors and w in self.num.keys():
                            found = True
                            for j in range(0,self.num[w]):
                                self.generateCmd(actor, None , w, j+1, sid, action, label, precmd, wait)
                                if (event is not None):
                                    count[event + "."+str(j+1)] = sid
                                sid += 1
                    if not found:

                        self.generateCmd(actor, None, w, None, sid, action, label, precmd, wait)
                        if (event is not None):
                            count[event] = sid
                        sid += 1
                        
        for w in self.actors:
            if w in self.num.keys():
                found = True
                for i in range(0,self.num[w]):
                    self.clear[label] += "execute_stop \"" + w + "-" + str(i+1)+ "\"  \"all\" 0 all &\n"
            else:
                self.clear[label] += "execute_stop \"" + w + "\" \"all\" 0 all &\n"



    def generateCmd(self, actor1, i, actor2 , j, sid, action, label, precmd, wait):
        precmd = " "+precmd;
        naction = self.bindings_parsed[action]
        if (j is not None):
            naction = re.sub(r'(\s|^|\()'+actor2+'(\s|$|:|\))', r'\1'+actor2+"-"+str(j)+r'\2', naction)
        print("Naction ", naction)
        rcnt = 1
        for exp in self.special:
            re_exp = r'{}'.format(exp)
            r1 = re.findall(re_exp,naction)
            if len(r1) > 0:
                for r in r1:
                    print("Found ", r, " in ", naction)
                    searchtext = r
                    candtext = self.special[exp]
                    if not isinstance(r,str):
                        searchtext = r[0]
                        newtext = r[1].strip("()")
                        candtext = candtext.replace("$node", r[1].strip("()"))
                    if i is not None:
                        self.run[label] += "tmp"+str(rcnt)+"=$(ssh -o StrictHostKeyChecking=no " + actor1+"-"+str(i)+".$exp.$proj \"echo \`"+candtext+"\`\")\n"
                    else:
                        self.run[label] += "tmp"+str(rcnt)+"=$(ssh -o StrictHostKeyChecking=no " + actor1+".$exp.$proj \"echo \`"+candtext+"\`\")\n"
                    naction = naction.replace(searchtext, "$tmp"+str(rcnt))
                    rcnt += 1

        if i is not None:            
            self.run[label] += "execute_fork \"" + actor1 + "-" + str(i)+ "\" \"" + naction +"\" " + str(sid) + " " + action
        else:
            self.run[label] += "execute_fork \"" + actor1 + "\" \"" + naction +"\" " + str(sid) + " " + action

        if wait is not None:
            self.run[label] += " " + str(wait) + " "
        else:
            self.run[label] += " 0 " 
        self.run[label] += "&\n"

        if i is not None:
            saction="script."+str(sid)+"."+action+"."+actor1+"-"+str(i)+".sh"
            self.tmp[label] += "cmd "+str(sid)+precmd+"actor " + actor1 + "-" + str(i)+ " action " + saction + "\n"
        else:
            saction="script."+str(sid)+"."+action+"."+actor1+".sh"
            self.tmp[label] += "cmd "+str(sid)+precmd+"actor " + actor1 + " action " + saction + "\n"

        
    def collectConds(self):
        self.conditions = dict()
        for s in self.scenario_parsed:
            for c in s[2]:
                self.cflags[c] = 0
        for b in self.bindings_parsed:            
            r1 = re.findall(r"(pexists\()(\w+)", self.bindings_parsed[b])
            if len(r1) > 0:
                for r in r1:
                    self.cflags[r[1]] |= 1
                    self.conditions[b] = ['pexists',r[1]]
            r1 = re.findall(r"(psuccess\()(\w+)", self.bindings_parsed[b])
            if len(r1) > 0:
                for r in r1:
                    self.cflags[r[1]] |= 2
                    self.conditions[b] = ['psuccess',r[1]]
                    print("Condition ", b ," psuccess ", r[1])
        
                
    def generateDew(self):
        for label in self.labels:
            self.clear[label] = ""
            self.run[label] = "#!/usr/bin/bash\n"
            self.run[label] += '##################################################################\n#'
            self.run[label] += '# ' .join(self.dew.splitlines(True))
            self.run[label] += '##################################################################\n\n'

    def generateArgParse(self):
        for label in self.labels:
            self.evars[label] = []
            vars = { 1: 'proj',  2: 'exp', 3: 'label' }
            vlong = { 1: 'project under which to run',  2: 'experiment under which to run', 3: 'label for the folder where to store results' }
            nvar = 4
            pos_vars = []
            for s in self.scenario_parsed:
                if (label != s[-1]):
                    continue
                action = s[2][0]
                clist = s[0]
                if action in self.bindings_parsed:
                    pos_vars.append(self.bindings_parsed[action])
                if clist is not None:
                    for c in clist:
                        if self.bindings_parsed != {}:
                            pos_vars.append(self.bindings_parsed[c])
                            if s[4] is not None:
                                pos_vars.append("wait " + s[4])    
            
            for stmt in pos_vars:
                r1 = re.findall(r"\$\w+", stmt)
                if len(r1) > 0:
                    for m in r1:                    
                        vars[nvar] = m.replace("$", "")
                        vlong[nvar] = "variable in command " + stmt.replace("$","")
                        nvar += 1
            guidance = "Usage: $0"
            for v in vars:
                guidance += " "+vars[v]
            guidance += "\n"
            for v in vars:
                guidance += "\n\t\t"+vars[v]+" - "+vlong[v]
                if v > 3:
                    self.evars[label].append((vars[v],vlong[v]))
            guidance += "\n\n";        
            argstring = "if [ \"$#\" -le " + str(nvar-2) + " ]; then\n\tprintf \""+guidance+"\"\n\texit 1\nfi\n\n"
            for v in vars:
                argstring += vars[v] + "=$" + str(v) + "\n"

            self.run[label] += argstring
        

    def generatePostamble(self, mode=None):

        #Jelena: should say if mode == "job":
        for label in self.labels:
            self.run[label] += "echo \"" + self.tmp[label] + "\" > $path/DEW/$id/scenario.txt\n"
            self.run[label] += "sleep 10\n"
            self.run[label] += "mytime=`date +%s`\nmytime=$(($mytime+60))\n"

            for actor in self.actors:
                if (actor in self.num.keys()):
                    for i in range(0,self.num[actor]):
                        self.run[label] += "python3 /share/shared/dew/submitjob.py " + actor + "-" + str(i+1) + " \"init " + actor + "-" + str(i+1) + " $path/DEW/$id/scenario.txt\"\n";
                else:
                    self.run[label] += "python3 /share/shared/dew/submitjob.py " + actor + " \"init " + actor + " $path/DEW/$id/scenario.txt\"\n";

            for actor in self.actors:
                if (actor in self.num.keys()):
                    for i in range(0,self.num[actor]):
                        self.run[label] += "python3 /share/shared/dew/submitjob.py " + actor + "-" + str(i+1)+" \"start $mytime $path/DEW/$id\"\n";
                else:
                    self.run[label] += "python3 /share/shared/dew/submitjob.py " + actor + " \"start $mytime $path/DEW/$id\"\n";                        
            
        for label in self.labels:
            self.clear[label] += open('./DewFunctions/Generators/das/das_clean_postamble.txt', 'r').read()
                
    def generatePreamble(self):
        for label in self.labels:
            self.run[label] += open('./DewFunctions/Generators/das/das_preamble.txt', 'r').read()
            self.clear[label] += open('./DewFunctions/Generators/das/das_clean.txt', 'r').read()

    def parse(self, mode=None):
        super().parse(mode)



