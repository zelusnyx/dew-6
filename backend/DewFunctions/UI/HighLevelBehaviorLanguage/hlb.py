import re
import sys

sys.path.append('../')
from HighLevelBehaviorLanguage.hlb_parser import HLBParser, HLBHintType
from deploy.constraints import removeEndDigit
import globals
try:
    from tkinter import filedialog
except ImportError:
    import tkFileDialog

try:
    import xir
    from xir import eq, choice, gt, ge, select
    NOXIR=False
except ImportError:
    NOXIR=True

# handle button events
def press(button):
    print(button)

def same_pref(a,b):
    i = a[0:a.rfind(".")]
    j = b[0:b.rfind(".")]
    return (i == j)

def save_routes():
    routes = dict()

    for a in globals.links:
        for b in globals.links[a]:
            if a not in routes:
                routes[a] = dict()
            routes[a][b] = dict()
            routes[a][b]['n'] = b
            routes[a][b]['h'] = 1
            if b not in routes:
                routes[b] = dict()
            routes[b][a] = dict()
            routes[b][a]['n'] = a
            routes[b][a]['h'] = 1

    for l in globals.lans:
        for a in globals.lans[l]:
            for b in globals.lans[l]:
                if a == b:
                    continue
                if a not in routes:
                    routes[a] = dict()
                routes[a][b] = dict()
                routes[a][b]['n'] = b
                routes[a][b]['h'] = 1

    while True:
        updates = 0
        for a in routes:
            for b in routes[a]:
                for c in routes[a]:
                    if c == b:
                        continue
                    if routes[a][b]['h'] > 1:
                        continue
                    if c not in routes[b] or (c in routes[b] and routes[b][c]['h'] > routes[a][c]['h']+1):
                        if c not in routes[b]:
                            routes[b][c] = dict()
                        routes[b][c]['n'] = a
                        routes[b][c]['h'] = routes[a][c]['h']+1
                        updates += 1
        if updates == 0:
            break

    f = open("setup.txt", "w")

    for a in globals.addresses:
        for b in globals.addresses[a]:
            f.write("address "+a+" "+b+"\n")

    for a in routes:
        for b in routes[a]:
            if routes[a][b]['h'] > 1:
                c = routes[a][b]['n']
                for i in globals.addresses[a]:
                    for j in globals.addresses[b]:
                        c = routes[a][b]['n']
                        for k in globals.addresses[c]:
                            if same_pref(k,i):
                                f.write("route "+i+" "+j + " "+k+"\n")
                                break
        


def save_docker(f):
    # decide on lan IPs
    nets = dict()
    nc = 0

    lls = dict()

    savelinks = globals.links.keys()
    for a in savelinks:
        for b in globals.links[a]:
            add1 = "172.1." + str(nc)
            globals.links[a][b] = add1
            nets[add1] = 1            
            if a not in globals.addresses:
                globals.addresses[a] = dict()
            globals.addresses[a][add1+".3"] = 1
            if b not in globals.links:
                globals.links[b] = dict()
            globals.links[b][a] = add1 
            nets[add1] = 2
            if b not in globals.addresses:
                globals.addresses[b] = dict()
            globals.addresses[b][add1 + ".4"] = 1
            nc += 1
            if a not in lls:
                lls[a] = dict()
            lls[a][b] = add1+".3"
            if b not in lls:
                lls[b] = dict()
            lls[b][a] = add1+".4"

    for l in globals.lans:
        lc = 3
        for i in globals.lans[l]:
            add1 = "172.1." + str(nc) + "." + str(lc)
            globals.lans[l][i] = add1
            if i not in globals.addresses:
                globals.addresses[i] = dict()
            globals.addresses[i][add1] = 1
            lc += 1
        nets[l] = "172.1." + str(nc)
        nc += 1

    f.write("version: '3'\nservices:\n");
    for a in globals.nodes:
        f.write("\n "+a+":\n  build:\n   dockerfile: custom.dock\n   context: .\n  command: /bin/setroutes.pl\n  privileged: true\n  networks:\n")
        if a in globals.links:
            for b in globals.links[a]:
                if (re.search(r".3$",lls[a][b]) != None):
                    name = "link-"+a+"-"+b
                else:
                    name = "link-"+b+"-"+a
                f.write("   " + name + ":\n    ipv4_address: " + lls[a][b] + "\n")

        for l in globals.lans:
            if a in globals.lans[l]:
                f.write("   " + l + ":\n    ipv4_address: " + globals.lans[l][a] + "\n")

        
    f.write("\n\nnetworks:\n")
    for a in globals.links:
        for b in globals.links[a]:
            if (re.search(r".3$",lls[a][b]) != None):
                f.write(" link-" + a + "-" + b + ":\n  driver: bridge\n  ipam:\n   driver: default\n   config:\n   -\n     subnet: "+globals.links[a][b]+".0/24\n\n")

            
    for l in globals.lans:
        f.write(" " + l +  ":\n  driver: bridge\n  ipam:\n   driver: default\n   config:\n   -\n     subnet: "+nets[l]+".0/24\n\n")

    f.close()
    save_routes()

def save(f):
    if NOXIR:
        print("No xir.")
        return

    top = xir.Xir()
    nodes = dict()
    for n in globals.nodes:                                                                                                                        
        node = top.structure.node({'name': n})
        nodes[n] = node

    for a in globals.links:
        for b in globals.links[a]:
            top.structure.connect([nodes[a], nodes[b]], {})

    for l in globals.lans:
        lan = top.structure.node({'name': l, 'capability': select('switch')})
        for i in globals.lans[l]:
            top.structure.connect([nodes[i], lan], {
                    "stack": eq("ip")})
 
    #f.write(top.xir())
    print(top.xir())



#            f.write("\tendpoints: [[" + a + "],[" + b +"\n")
#            f.write("\tprops: {}\n");

#    for l in globals.lans:
#        f.write("net:\n")
#        f.write("\tid: " + str(n) + '\n')
#        f.write("\tnodes: [")
#        first = 0
#        for i in globals.lans[l]:
#                if first == 1:
#                    f.write(",")
#                first = 1
#                f.write(str(i));
#        f.write("]\n");
#
#    f.write("}\n\n")
#    f.write("behavior: {\n")
#   text = globals.app.getTextArea("behavior")        
#    f.write(text)
#    f.write("\n}\n\n")






def getSuggestionsForEvent(evtype):
    print("In api")
    suggestions = []
    suggestion_text = ''
    if evtype == "actors_only":
        for a in globals.actors:
            if a != "" and a not in globals.sbuttons:
                print("add actor %s" % a)
                suggestions.append(a)
    elif evtype == "actions_only":
        for a in globals.actions:
            if a != "" and a not in globals.sbuttons:
                print("add action %s" % a)
                suggestions.append(a)
    elif evtype == "methods_only":
        pass
    elif evtype == "events_only":
        for e in globals.events:
            if e != "":
                suggestions.append(e)
    elif evtype == "behaviors_enter" or evtype == "when_enter":
        print("Actors %d" % len(globals.actors))
        for a in globals.actors:
            if a != "":
                print("add actor %s" % a)
                suggestions.append(a)
        if evtype == "behaviors_enter":
            for e in globals.events:
                eline="when "+e
                suggestions.append(eline)
        for s in ["wait t", "@"]:
            print("adding: ", s)
            suggestions.append(s)
    elif evtype == "constraints_enter":
        suggestions = suggestions + ["link","lan"]
        for a in globals.actors:
            if a != "" and a not in globals.sbuttons:
                print("add actor %s" % a)
                suggestions.append(a)
        #suggestions = suggestions + ["num", "os","link","lan","interfaces","location","nodetype"]
    elif evtype == "emit":
        suggestions.append("emit")
        # globals.sbuttons["emit"] = 1
        # globals.app.addButton("emit", pb)
    elif evtype == "start_config":
        suggestions.append("[")
        for a in globals.actors:
            if a != "" and a not in globals.sbuttons:
                suggestions.append(a)
    elif evtype == "in_config_link":
        suggestions = suggestions + ["bw", "delay"]
    elif evtype == "in_config_actor":
        suggestions = suggestions + ["num", "os","location","nodetype", "ip"]
    elif evtype == "constraints_end":
        suggestions += ["]", ","]
    elif evtype == "end_sentence":
        suggestions = [" "]
    else: # it was text to be displayed as label
        #suggestions.append(evtype)
        suggestion_text = evtype
    #globals.app.stopLabelFrame()
    # globals.app.stopScrollPane()
    return suggestions,suggestion_text


def prefix(mystring):
    p = 0
    for i in str(mystring):
        if i.isdigit():
            return mystring[0:p-1]
        p += 1
    return None

