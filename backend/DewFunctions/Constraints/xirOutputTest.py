import xir
import json

class globalData:
    nodes = {'a': 1, 'b': 1, 'c': 1}
    links = {'a': {'b': ''}}
    #lans = {'lan1': {'a': 1, 'c': 1}}
    constraints = {'a': {'os': 'ubuntu', 'num': '5'}, 'c': {'num': '10'}, 'c1': {'os': 'fred'}}
    lans = {}

globals = globalData()




def save():
    if False:
        print('No xir.')
        return
    top = xir.Xir()
    nodes = dict()
    for n in globals.nodes:
        props = {'name': n}
        if n in globals.constraints:
            if 'os' in globals.constraints[n]:
                props['image'] = xir.select(globals.constraints[n]['os'])
            if 'nodetype' in globals.constraints[n]:
                props['platform'] = xir.select(globals.constraints[n]['nodetype'])
                 
        node = top.structure.node(props)
        nodes[n] = node

    for a in globals.links:
        for b in globals.links[a]:
            top.structure.connect([nodes[a], nodes[b]], {})

    CAN_HANDLE_LANS = False
    if CAN_HANDLE_LANS:
        for l in globals.lans:
            lan = top.structure.node({'name': l, 'capability': xir.select('switch')})
            for i in globals.lans[l]:
                top.structure.connect([nodes[i], lan], {
                        "stack": xir.eq("ip")})
 
    # f.write(top.xir())
    #print(top.xir())
    print(json.dumps(top.structure.xir_dict(), indent=2))
    

save()

