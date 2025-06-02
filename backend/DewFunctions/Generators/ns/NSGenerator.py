from os import link
import os.path
import sys
from functools import reduce
import re
import ipaddress

cwd = os.path.dirname(os.path.realpath(__file__))
parentDir = os.path.abspath(os.path.join(cwd, os.pardir))
sys.path.insert(0, parentDir)
from generator import Generator

class NSGenerator(Generator):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, name="ns", **kwargs)
        self.evars = []

    def generate(self, mode=None):
        super().generate(mode)

        self.collectNum()
        self.generatePreamble("main")        
        self.generateNS()
        self.generatePostamble("main")        

    def collectNum(self):
        self.num = dict()
        for c in self.constraints_parsed:
            if (c[0] == 'config') and ('num' in c[2]):
                number = c[2][c[2].index('num') + 1]
                for act in c[1]:
                    self.num[act] = int(number)
                continue
            if ((c[0] in ['config', 'link', 'lan'])):
                for act in c[1]:
                    if act not in self.num.keys():
                        self.num[act] = 1
                continue


    def samesubnet(self, a,b):
        an = int(ipaddress.ip_address(a)) & ((2**24 - 1) << 8)
        bn = int(ipaddress.ip_address(b)) & ((2**24 - 1) << 8)
        return (an == bn)

    def generateNS(self):
        
        # Collect all actors
        actors = dict()
        os = dict()
        ip = dict()
        hw = dict()
        links = dict()
        link_lines = []
        lan_lines = []

        for s in self.scenario_parsed:
            actors[s[1][0]] = 1

        # Collect OS constraints
        for c in self.constraints_parsed:
            if (c[0] == 'config') and ('os' in c[2]):
                config_os = c[2][c[2].index('os') + 1]
                for act in c[1]:
                    os[act] = config_os

        # Collect IP Address Constraints
        for c in self.constraints_parsed:
            if (c[0] == 'config') and ('ip' in c[2]):
                config_ip = c[2][c[2].index('ip') + 1]
                for act in c[1]:
                    if act in self.num.keys():
                        if self.num[act] == 1:
                            ip[act] = config_ip
                        else:
                            for i in range (1, self.num[act]+1):
                                ip[act+'('+str(i)+')'] = config_ip
                                config_ip = str(ipaddress.ip_address(int(ipaddress.ip_address(config_ip))+1))
                    else:
                        ip[act] = config_ip


        # Collect Hardware Type Constraints
        for c in self.constraints_parsed:
            if (c[0] == 'config') and ('nodetype' in c[2]):
                config_hw = c[2][c[2].index('nodetype') + 1]
                for act in c[1]:
                    hw[act] = config_hw


        # Collect link constraints
        cl = 0
        lans = dict()
        links = dict()
        bw = dict()
        delay = dict()
        for c in self.constraints_parsed:
            if 'link' in c[0]:
                a = c[1][0]
                b = c[1][1]
                actors[a] = 1
                actors[b] = 1
                if a not in links.keys() and b not in links.keys():
                    links[a] = dict()
                    links[a][b] = 1
                elif a in links.keys():
                    links[a][b] = 1
                else:
                    links[b][a] = 1
            elif 'lan' in c[0]:
                lans[cl] = []
                for n in c[1]:
                    actors[n] = 1
                    if n in self.num.keys() and self.num[n]!=1:
                        for i in range (1, self.num[n]+1):
                            lans[cl].append(n+"-"+str(i))
                    else:
                        lans[cl].append(n)
                cl += 1
            if c[0] in ['link','lan']:
                if c[2]!=None:
                    if 'bw' in c[2]:
                        link_bw = c[2][c[2].index('bw')+1]
                        bw[' '.join(c[1])] = link_bw
                    if 'delay' in c[2]:
                        link_delay = c[2][c[2].index('delay')+1]
                        delay[' '.join(c[1])] = link_delay
                    
        # Generate nodes
        label="main"
        for a in actors:
            if a in self.num.keys() and self.num[a]!=1:
                self.run[label] +=  "set NODES " + str(self.num[a]) + "\n"
                self.run[label] += "for {set i 1} {$i <= $NODES} {incr i} {\n"
                self.run[label] += "\t set "+a+"($i) [$ns node]"
                if (a in os.keys()):
                    self.run[label] += "\n\t tb-set-node-os $" + a + "($i) " + os[a]
                else:
                    self.run[label] += "\n\t tb-set-node-os $" + a + "($i) Ubuntu-DEW"
                if (a in hw.keys()):
                    self.run[label] += "\n\t tb-set-hardware $" + a + "($i) " + hw[a]
                # else: # Default Condition
                #     self.run[label] += "\n\t tb-set-hardware [set "+a+"($i)] " + hw[a]
                self.run[label] += "\n}\n"
            else:
                self.run[label] += "set "+ a +" [$ns node]"
                if (a in os.keys()):
                    self.run[label] += "\ntb-set-node-os $" + a + " "+ os[a]
                else:
                    self.run[label] += "\ntb-set-node-os $" + a + " Ubuntu-DEW"
                if (a in hw.keys()):
                    self.run[label] += "\ntb-set-hardware $" + a + " "+ hw[a]
                # else: # Default Condition
                #     self.run[label] += self.run[label] += "\ntb-set-node-os "+ a +" "+ hw[a]
                self.run[label] += "\n"


        # Generate links 
        cnt = 1
        for a in links.keys():
            if a in self.num.keys():
                for i in range (1, self.num[a]+1):
                    for b in links[a].keys():
                        current_bw = '100Mb'
                        current_delay = '0ms'
                        if(set([a,b]) in [set(x.split(' ')) for x in bw.keys()]):
                            current_bw = bw[a + ' ' + b] if ((a + ' ' + b) in bw) else bw[b + ' ' + a]
                            current_bw = str(float(current_bw)*1000) + 'Mb' 
                        if(set([a,b]) in [set(x.split(' ')) for x in delay.keys()]):
                            current_delay = delay[a + ' ' + b] if ((a + ' ' + b) in delay) else delay[b + ' ' + a] 
                            current_delay = str(current_delay) + 'ms' 
                        if b in self.num.keys():
                            for j in range (1,self.num[b]+1):
                                pointer_a = ""
                                pointer_b = ""
                                if self.num[a]!=1:
                                    pointer_a = f"({str(i)})"
                                if self.num[b]!=1:
                                    pointer_b = f"({str(j)})"
                                line = "set link"+str(cnt)+" [$ns duplex-link $"+a+pointer_a+" $"+b+pointer_b+" " + str(current_bw) + " " + str(current_delay) + " DropTail]\n"
                                self.run[label] += line
                                link_lines.append(line)
                                cnt += 1
                        else:
                            pointer_a = ""
                            pointer_b = ""
                            if self.num[a]!=1:
                                pointer_a = f"({str(i)})"
                            line = "set link"+str(cnt)+" [$ns duplex-link $"+a+pointer_a+" $"+b+" " + str(current_bw) + " " + str(current_delay) + " DropTail]\n"
                            self.run[label] += line
                            link_lines.append(line)
                            cnt += 1
            else:
                 for b in links[a].keys():
                    current_bw = '100Mb'
                    current_delay = '0ms'
                    if(set(a,b) == set(x.split(' ')) for x in bw.keys()):
                        current_bw = bw[a + ' ' + b] if ((a + ' ' + b) in bw) else bw[b + ' ' + a]
                        current_bw = str(float(current_bw)*1000) + 'Mb'  
                    if(set(a,b) == set(x.split(' ')) for x in delay.keys()):
                        current_delay = delay[a + ' ' + b] if ((a + ' ' + b) in delay) else delay[b + ' ' + a]
                        current_delay = str(current_delay) + 'ms' 
                    if b in self.num.keys():
                        for j in range (1,self.num[b]+1):
                            pointer_a = ""
                            pointer_b = ""
                            if self.num[b]!=1:
                                pointer_b = f"({str(j)})"
                            line = "set link"+str(cnt)+" [$ns duplex-link $"+a+" $"+b+pointer_b+" " + str(current_bw) + " " + str(current_delay) + " DropTail]\n"
                            self.run[label] += line
                            link_lines.append(line)
                            cnt += 1
                    else:
                        pointer_a = ""
                        pointer_b = ""
                        line = "set link"+str(cnt)+" [$ns duplex-link $"+a+" $"+b+" 100Mb 0ms DropTail]\n"
                        self.run[label] += line
                        link_lines.append(line)
                        cnt += 1

        # Generate lans
        for l in lans.keys():
            lannodes = []
            lanindexes = []
            line = "set lan"+str(l)+" [$ns make-lan \""
            for le in lans[l]:
                litems = le.split('-')
                lannodes.append(litems[0])
                if len(litems) == 2:
                    lanindexes.append(litems[1])
                else:
                    lanindexes.append('')
            nline = ''
            li = 0
            for ln in lannodes:
                if (len(nline) > 0):
                    nline += ' '
                nline += '$'+ln
                if lanindexes[li] != '':
                    nline += "("+str(lanindexes[li])+")"
                li += 1
            line += nline 
            current_bw = '100Mb'
            current_delay = '0ms'
            for b in bw.keys():
                found = True
                for nbw in b.split(' '):
                    foundone = False
                    for nlan in lannodes:
                        if nbw == nlan:
                            foundone = True
                    if not foundone:
                        found = False
                if found:
                    current_bw = str(float(bw[b])*1000) + 'Mb'
            for d in delay.keys():
                found = True
                for nd in d.split(' '):
                    foundone = False
                    for ndel in lannodes:
                        if nd == ndel:
                            foundone = True
                    if not foundone:
                        found = False
                if found:
                    current_delay = str(delay[d]) + 'ms'

            line += "\" " + str(current_bw) + " " + str(current_delay) + "]\n"
            self.run[label] += line
            lan_lines.append(line)

        self.run[label] += '\n\n'

        # Generate IP Addresses

        for line in link_lines:
            nodes = re.findall('(?<=duplex-link\s)(([\$\(\)a-zA-Z0-9-]+\s)+)(?=[0-9.]+Mb)', line)
            nodes = (nodes[0][0][:-1]).split(' ')
            regex_links = re.findall('link[0-9]+', line) 
            current_ip = ''
            for node in nodes:
                if node[1:] in ip:
                    if current_ip == '' or self.samesubnet(current_ip, ip[node[1:]]):
                        line = f'tb-set-ip-link {node} ${regex_links[0]} {ip[node[1:]]}\n'
                        self.run[label] += line
                        current_ip = ip[node[1:]]
                        ip[node[1:]] = str(ipaddress.ip_address(int(ipaddress.ip_address(ip[node[1:]]))+256))                        
                    else:
                        # Cannot assign this IP address
                        pass
                        

        self.run[label] += '\n\n'

        for line in lan_lines:
            nodestring = re.findall('(make-lan\s)(\")((\$[a-zA-Z0-9\(\)\s]+)+)(\")', line) #(([\$\(\)a-zA-Z0-9-]+\s)+)(?=")', line)
            nodes = nodestring[0][2].split(' ')
            regex_lan = re.findall('lan[0-9]+', line)
            current_ip = ''
            for node in nodes:
                if node[1:] in ip:
                    if current_ip == '' or self.samesubnet(current_ip, ip[node[1:]]):
                        line = f'tb-set-ip-lan {node} ${regex_lan[0]} {ip[node[1:]]}\n'
                        self.run[label] += line
                        current_ip = ip[node[1:]]
                    else:
                        # Cannot assign this IP address
                        pass


            
    def generatePreamble(self, label):
        self.run[label] = '# generated by DEW 2.0\nset ns [new Simulator]\nsource tb_compat.tcl\n\n'

    def generatePostamble(self, label):
        self.run[label] += '\n$ns rtproto Static\n$ns run\n\n'

    def parse(self, mode=None):
        super().parse(mode)



