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

class MergeTBGenerator(Generator):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, name="mergeTB", **kwargs)
        self.evars = []

    def generate(self, mode=None):
        super().generate(mode)

        self.collectNum()
        self.generatePreamble("main")        
        self.generateMergeTB()
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


    def findsubnet(self, a,b):
        for n in range(1,31):
            an = int(ipaddress.ip_address(a)) & ((2**24 - 1) << n)
            bn = int(ipaddress.ip_address(b)) & ((2**24 - 1) << n)
            if (an == bn):
                return 32-n

    def samesubnet(self, a,b):
        an = int(ipaddress.ip_address(a)) & ((2**24 - 1) << 8)
        bn = int(ipaddress.ip_address(b)) & ((2**24 - 1) << 8)
        return (an == bn)
    
    def generateMergeTB(self):
        
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
                                ip[act+'-'+str(i)] = config_ip
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
        longlinks = dict()
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
                    print("Link between ", a, " and ", b)
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
                    
        label="main"
            
        experimentName = self.experimentName
        sampleList = experimentName.split()
        experimentName = "-".join(sampleList)
        self.run[label] += "# create a topology named '" + experimentName + "'\n"
        self.run[label] += f"net = Network('{experimentName}', addressing==ipv4)\n"

        # Generate nodes
        nodeName_in_list = []
        if set(actors) != set(os.keys()):
            self.run[label] += "nodes = [net.node(name) for name in ["
            count = 0
            for a in actors:
                if a in os.keys():
                    continue
                count += 1
                if a in self.num.keys() and self.num[a] != 1:
                    for i in range(1,self.num[a]+1):
                        self.run[label] += " '"+ str(a) + "-" + str(i) + "'"
                        nodeName_in_list.append(str(a) + "-" + str(i))
                        self.run[label] += ","
                else:
                    self.run[label] += " '"+ str(a) + "'"
                    nodeName_in_list.append(str(a))
                    self.run[label] += ","
            self.run[label] = self.run[label][:-1] + "]]\n"
        else:
            self.run[label] += "nodes = []\n"
        count = 0
        for a in actors:
            if a not in os.keys():
                continue
            self.run[label] += f"nodes = nodes + [net.node(name, image=='{os[a]}') for name in ["
            count += 1
            if a in self.num.keys() and self.num[a] != 1:
                for i in range(1,self.num[a]+1):
                    self.run[label] += " '"+ str(a) + "-" + str(i) + "'"
                    nodeName_in_list.append(str(a) + "-" + str(i))
                    self.run[label] += ","
            else:
                self.run[label] += " '"+ str(a) + "'"
                nodeName_in_list.append(str(a))
                self.run[label] += ","
            self.run[label] = self.run[label][:-1] + "]]\n"

        # Generate links 
        cnt = 0
        for a in links.keys():
            if a in self.num.keys():
                for i in range (1, self.num[a]+1):
                    for b in links[a].keys():
                        current_bw = '100'
                        current_delay = '0'
                        if(set([a,b]) in [set(x.split(' ')) for x in bw.keys()]):
                            current_bw = bw[a + ' ' + b] if ((a + ' ' + b) in bw) else bw[b + ' ' + a]
                            current_bw = str(float(current_bw)*1000)  
                        if(set([a,b]) in [set(x.split(' ')) for x in delay.keys()]):
                            current_delay = delay[a + ' ' + b] if ((a + ' ' + b) in delay) else delay[b + ' ' + a] 
                            current_delay = str(current_delay)  
                        if b in self.num.keys():
                            for j in range (1,self.num[b]+1):
                                pointer_a = ""
                                pointer_b = ""
                                if self.num[a]!=1:
                                    pointer_a = f"-{str(i)}"
                                if self.num[b]!=1:
                                    pointer_b = f"-{str(j)}"
                                line = f"link{str(cnt)} = net.connect([nodes[{nodeName_in_list.index(f'{a}{pointer_a}')}], nodes[{nodeName_in_list.index(f'{b}{pointer_b}')}]], capacity==mbps({current_bw}), latency==ms({current_delay}))\n"
                                longlinks[cnt] = []
                                longlinks[cnt].append(f'{a}{pointer_a}')
                                longlinks[cnt].append(f'{b}{pointer_b}')
                                self.run[label] += line
                                link_lines.append(line)
                                cnt += 1
                        else:
                            pointer_a = ""
                            pointer_b = ""
                            if self.num[a]!=1:
                                pointer_a = f"-{str(i)}"
                            line = f"link{str(cnt)} = net.connect([nodes[{nodeName_in_list.index(f'{a}{pointer_a}')}], nodes[{nodeName_in_list.index(f'{b}')}]], capacity==mbps({current_bw}), latency==ms({current_delay}))\n"
                            self.run[label] += line
                            link_lines.append(line)
                            longlinks[cnt] = []
                            longlinks[cnt].append(f'{a}{pointer_a}')
                            longlinks[cnt].append(f'{b}{pointer_b}')
                            cnt += 1
            else:
                 for b in links[a].keys():
                    current_bw = '100'
                    current_delay = '0'
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
                                pointer_b = f"-{str(j)}"
                            line = f"link{str(cnt)} = net.connect([nodes[{nodeName_in_list.index(f'{a}')}], nodes[{nodeName_in_list.index(f'{b}{pointer_b}')}]], capacity==gbps({current_bw}), latency==ms({current_delay}))\n"
                            self.run[label] += line
                            longlinks[cnt] = []
                            longlinks[cnt].append(f'{a}{pointer_a}')
                            longlinks[cnt].append(f'{b}{pointer_b}')
                            link_lines.append(line)
                            cnt += 1
                    else:
                        pointer_a = ""
                        pointer_b = ""
                        line = f"link{str(cnt)} = net.connect([nodes[{nodeName_in_list.index(f'{a}{pointer_a}')}], nodes[{nodeName_in_list.index(f'{b}{pointer_b}')}]], capacity==gbps({current_bw}), latency==ms({current_delay}))\n"
                        self.run[label] += line
                        longlinks[cnt] = []
                        longlinks[cnt].append(f'{a}{pointer_a}')
                        longlinks[cnt].append(f'{b}{pointer_b}')
                        link_lines.append(line)
                        cnt += 1

        print("Nodes ",nodeName_in_list)
        # Generate lans
        for l in lans.keys():
            lannodes = []
            lanindexes = []
            line = "lan" + str(l) + " = net.connect(["
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
                    nline += ','
                if lanindexes[li] != '':
                    nline += f"nodes[{nodeName_in_list.index(f'{ln}-{lanindexes[li]}')}]"
                else:
                    nline += f"nodes[{nodeName_in_list.index(f'{ln}')}]"
                li += 1
            line += nline 
            current_bw = '100'
            current_delay = '0'
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
                    current_bw = str(float(bw[b])*1000) 
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
                    current_delay = str(delay[d])


            line = line + f"], capacity==mbps({current_bw}), latency==ms({current_delay}))\n"
            self.run[label] += line
            lan_lines.append(line)

        self.run[label] += '\n\n'

#        actor = []
#        for act in ip.keys():
#            actor.append(act)


        for lan in lans:
            a = b = None
            mask = 31
            found = False
            for n in lans[lan]:
                if n in ip.keys():
                    found = True
                    if a == None:
                        a = n
                    elif b == None:
                        b = n
                    else:
                        m = self.findsubnet(ip[a], ip[b])
                        if (m < mask):
                            mask = m
                        b = None
            if a != None and b != None:
                m = self.findsubnet(ip[a], ip[b])
                if (m < mask):
                    mask = m
            # If there is any IP directive go through assignment
            if found:
                for n in lans[lan]:
                    if n in ip.keys():
                        node_idx = nodeName_in_list.index(f'{n}')
                        line += "lan" + str(lan) + "[nodes[" + str(node_idx) + "]].socket.addrs = ip4(\'" + ip[n] + '/' + str(mask) +  "\')\n"

            self.run[label] += line        


        # Force links to have /24 mask
        for link in longlinks:
            line = ""
            a = b = None
            mask = 31
            found = False
            current_ip = ""
            for n in longlinks[link]:
                if n in ip.keys():
                    if current_ip == '' or self.samesubnet(current_ip, ip[n]):
                        node_idx = nodeName_in_list.index(f'{n}')
                        line += "link" + str(link) + "[nodes[" + str(node_idx) + "]].socket.addrs = ip4(\'" + ip[n] + "/24\')\n"
                        current_ip = ip[n]
                        ip[n] = str(ipaddress.ip_address(int(ipaddress.ip_address(ip[n]))+256))                        
                    else:
                        # Cannot assign this IP address
                        pass
                    
            self.run[label] += line
            
#        for item in actor:
#            line = ""
#            link_item = []
#            lan_item = []
#            for link_line in link_lines:
#                if f"nodes[{nodeName_in_list.index(f'{item}')}]" in link_line:
#                    link_item.append(re.findall('(link[0-9]+) = ', link_line)[0])
#            for l_item in link_item:
#                node_idx = nodeName_in_list.index(f'{item}')
#                line += f"{l_item}[{f'nodes[{node_idx}]'}].socket.addrs = ip4('{ip[act]}')\n" 
#            for lan_line in lan_lines:
#                nodel = "nodes[" + str(nodeName_in_list.index(f'{item}')) + "]"
#                print("Looking for ", nodel , " in ", lan_line)
#                if nodel in lan_line:
#                    lan_item.append(re.findall('(lan[0-9]+) = ', lan_line)[0])
#                    print("Found ", lan_item)
#            for l_item in lan_item:
#                print("Node ", item, " act ", act)
#                node_idx = nodeName_in_list.index(f'{item}')
#                line += f"{l_item}[{f'nodes[{node_idx}]'}].socket.addrs = ip4('{ip[item]}')\n"
#                print("Looking for ", nodel , " in ", lan_line)
#                if nodel in lan_line:
#                    lan_item.append(re.findall('(lan[0-9]+) = ', lan_line)[0])
#                    print("Found ", lan_item)

            
                
        self.run[label] += '\n\n'

            
    def generatePreamble(self, label):
        self.run[label] = "from mergexp import *\n"

    def generatePostamble(self, label):
        #self.run[label] += "# specify the net object as the experiment topology created by this script\n"
        self.run[label] += "experiment(net)\n"

    def parse(self, mode=None):
        super().parse(mode)



