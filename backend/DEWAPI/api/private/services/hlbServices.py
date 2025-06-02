import sys, os, uuid
from collections import defaultdict

sys.path.append('./DewFunctions/Generators/')
sys.path.append('./DewFunctions/Generators/ns')
sys.path.append('./DewFunctions/Generators/bash')
sys.path.append('./DewFunctions/Generators/das')
sys.path.append('./DewFunctions/Generators/mergeTB')
sys.path.append('./DewFunctions/UI/HighLevelBehaviorLanguage/')
sys.path.append('./DewFunctions/UI/')
sys.path.append('./DewFunctions/Translators/bash')
sys.path.append('./DewFunctions/Translators/magi')
import globals
import json
import hlb
import re
from parsebash import GeneralParseBash
from generator import Generator
from BashGenerator import BashGenerator as bashGenerator
from DasGenerator import DasGenerator as dasGenerator
from NSGenerator import NSGenerator as nSGenerator
from MergeTBGenerator import MergeTBGenerator as mergeTBGenerator
from hlb_parser import HLBParser, HLBHintType
from magiparser import GeneralParseMagi
import werkzeug

class HLBService():
    #   Handle Behavior Suggestions On Each Key Press
    def HandleBehaviorSuggestions(self, behaviors, given_actors, last_behavior):
        '''
        Takes an array of behaviors which are already completed and the last_behavior as the input and provides suggestion for the last behavior
        '''
        i=0
        # parse out events, globals.actors, actions and methods
        # from every line but the last

        parser = HLBParser(given_actors)
        # TODO : Remove globals
        for b in behaviors:
            globals.behaviors[i] = b
            i = i + 1

            type,vals,hints = parser.extract_partial(b)
            #print type, vals, hints
            if "actors" in vals and vals["actors"] != None:
                for a in vals["actors"]:
                    if a not in globals.actors:
                        self.addactor(a)

            if "action" in vals and vals["action"] != None:
                a=vals["action"]
                if a not in globals.actions:
                    globals.actions[a] = 1

            if "e_events" in vals and vals["e_events"] != None:
                for a in vals["e_events"]:
                    if a not in globals.events:
                        globals.events[a] = 1

        # Go through last behavior line to see what is the current state
        # start (waitd, wait) or (whene, when) or actor, actor, action, method, emit, done
        print("hello:::::::::",len(last_behavior),"::::")

        if last_behavior.startswith("@"):
            return self.addSuggestions(["enter label name"])

        type,vals,hints = parser.extract_partial(last_behavior)

        print(type)
        #print type,vals,hints
        if (type == HLBHintType.BLANK):
            return self.addSuggestions(["behaviors_enter"])
        elif(type == HLBHintType.REQ_WHEN_LIST):
             return self.addSuggestions(["events_only","enter event name"])
        elif(type == HLBHintType.REQ_ACTORS_HAVEWHEN):
            return self.addSuggestions(["when_enter"])
        elif(type == HLBHintType.REQ_WAIT_TIME):
            return self.addSuggestions(["enter variable name or wait time in second"])
        elif(type == HLBHintType.REQ_ACTORS):
            return self.addSuggestions(["actors_only"])
        elif(type == HLBHintType.REQ_ACTION):
            if (last_behavior.endswith(" ")):
                items = last_behavior.strip().split(" ")
                item = items[-1].strip(",")
                if item not in globals.actors:
                    self.addactor(item)
            return self.addSuggestions(["actions_only",  "enter action"])
            '''"actors_only",'''
        elif(type == HLBHintType.OPT_EMIT_STMT):
            if (last_behavior.endswith(" ")):
                items = last_behavior.strip().split(" ")
                item = items[-1].strip(",")
                if item not in globals.actions:
                    globals.actions[item] = 1

            return self.addSuggestions(["emit"])
        elif (type == HLBHintType.REQ_EMIT_LIST):
            return self.addSuggestions(["enter event name(s)"])


        return ['wait', 'emit', 'server', 'client', 'install_iperf', 'install_flooder', 'install_tcpdump', 'start_measure', 'start_server', 'mstarted', 'sstarted', 'when', 'mstarted', 'cstarted', 'astarted', 'astopped', 'attacker', 'start_traffic', 'start_attack', 'stop_attack', 'stop_traffic', 'cstopped', 'mstopped', 'calculate_entropy', 'stop_measure', 'COPY_TO_GITHUB'], ""

    def addactor(self, item):
        globals.actors[item] = 1
        globals.nodes[item] = 1
        if "lan0" not in globals.lans:
            globals.lans["lan0"] = dict()
        globals.lans["lan0"][item] = 1

        if ("actor"+str(globals.acn)) in globals.actors:
            globals.acn = globals.acn+1

    def addSuggestions(self, events):
        suggestions, suggestion_text = [], ''
        #scenario = json_data["behaviors"]
        for event in events:
            s,t = hlb.getSuggestionsForEvent(event)
            suggestions = suggestions + s
            suggestion_text = suggestion_text + t
        return suggestions, suggestion_text

    def HandleConstraintSuggestions(self, constraints, actors, last_constraint, scenarios):
        suggestions = []
        parser = HLBParser([])
        globals.actors = {}
        globals.actions = {}
        globals.events = {}
        globals.actors = {}

        for scenario in scenarios:
            _t,v,_h = parser.extract_partial(scenario)
            if v['actors'] is not None:
                for actor in v['actors']:
                    globals.actors[actor] = 1
            if v['e_events'] is not None:
                for events in v['e_events']:
                    globals.events[events] = 1
            if v['action'] is not None:
                globals.actions[v['action']] = 1
        items = re.split("[\s]",last_constraint.strip())
        # if item in ["num", "os","nodetype", "interfaces", "location", "link","lan"] and len(items) == 0:
        #     return self.addSuggestions(["actors_only"])
        item = items[-1]
        if len(item.strip())!=0:
            if (item == "num" or item == "interfaces" or item == "bw" or item=="delay"):
                return self.addSuggestions(["enter digit"])
            elif item == "os":
                # for os in globals.deploy_handler.getSuggestions(type='os'):
                    #addSuggestions(os, Centry)
                    # globals.app.addButton(os,Centry)
                    # globals.sbuttons[os]=1
                return self.addSuggestions(["enter OS"])
            elif item == "nodetype":
                # for nodetype in globals.deploy_handler.getSuggestions(type='nodetype'):
                #     globals.app.addButton(nodetype,Centry)
                #     globals.sbuttons[nodetype]=1
                return self.addSuggestions(["enter node type"])
            elif item == "link":
                return self.addSuggestions(["actors_only"])
            elif item == "lan":
                return self.addSuggestions(["actors_only"])
            elif item == "location":
                return self.addSuggestions(["enter testbed name"])
            elif item == "ip":
                return self.addSuggestions(["enter IP address"])
            elif item in globals.actors:
                return self.addSuggestions(["start_config"])
            elif (item == "[" or item[-1]==",") and (items[0]=="link" or items[0]=="lan"):
                return self.addSuggestions(["in_config_link"])
            elif (item == "[" or item[-1]==",") and items[0] in globals.actors:
                return self.addSuggestions(["in_config_actor"])
            elif (item==''):
                return self.addSuggestions(["constraints_enter"])
            elif (item.replace(",", "").strip().isdigit()):
                return self.addSuggestions(["constraints_end"])
            elif (item[-1]=="]"):
                return self.addSuggestions(["end of sentence"])
        else:
            return self.addSuggestions(["constraints_enter"])

    # Handle Translator
    def HandleTranslator(self,format, data):

        # EXPECTED = {
        #     "Format":["bash", "magi", "go"],
        #     "ReturnType":["dew", "json"]
        # }
        # errors = []

        # parse = reqparse.RequestParser()
        # parse.add_argument('file', type=werkzeug.datastructures.FileStorage, location='files')
        # args = parse.parse_args()
        # scriptFile = args['file']

        # if format not in EXPECTED["Format"]: errors.append(f"Not Vaild Format, should be bash, magi or go.")
        # if returnType not in EXPECTED["ReturnType"]: errors.append(f"Not Vaild ReturnType, should be dew or json.")
        # if(scriptFile == None): errors.append(f"Not Vaild File.")
        # else:
            # if(os.path.isdir("./UploadedScripts") == False):
            #     os.mkdir("./UploadedScripts")
            # scriptFile.save("./UploadedScripts/" + scriptFile.filename)

            # if(os.stat("./UploadedScripts/" + scriptFile.filename).st_size == 0):
            #     errors.append(f"File is empty.")
            # else:
            #     f = open("./UploadedScripts/" + scriptFile.filename, "r")
            #     data = ""
            #     dewOut = ""
            #     if f.mode == 'r':
            #         data = f.read()
            #     else:
            #         errors.append(f"Can not read from server.")
            #     f.close()

        #file = request.files['file']
        # if len(errors) <1:

            # for stringify json content
            # json_data = request.get_json(force=True)
            # data = json_data['InputFileContent']

            # s = []
            # c = []
            # b = []
            if(format == "bash"):
                return GeneralParseBash.parse(data), []
            if(format == "magi"):
                ## sample input
                #{
                #"  Script": "monitor_agent:\n  execargs: {}\n  group: monitor_group\n  path: /share/magi/modules/pktcounters/pktCountersAgent.tar.gz\nmonitor_group:\n- servernode\nmonitorstream:\n- triggers:\n  - event: serverStarted\n  type: trigger\n- agent: monitor_agent\n  args: {}\n  method: startCollection\n  trigger: collectionServer\n  type: event\n- triggers:\n  - event: clientStopped\n  type: trigger\n- agent: monitor_agent\n  args: {}\n  method: stopCollection\n  type: event\n"
                #}
                return GeneralParseMagi.parse(data)
            if(format == "go"):
                dewOut = "" #TODO: GO format
                return dewOut, [], [], [], []


            # if(os.path.isdir("./ReturnFiles") == False):
            #     os.mkdir("./ReturnFiles")

            # if(returnType == "json"):
            #     return {'Scenario':s, 'Constraints':c, 'Bindings':b}
            # elif(returnType == "dew"):
            #     with open("./ReturnFiles/" + os.path.splitext(scriptFile.filename)[0] + ".dew", "w") as file:
            #         file.write(dewOut)
            #     return send_file("./ReturnFiles/" + os.path.splitext(scriptFile.filename)[0] + ".dew")
        # else:
        #     # Return errors
        #     return {"_id":str(uuid.uuid4()),"errors":errors}

    # Handle Parse
    def HandleParse(self,json_data):
        # EXPECTED = {
        #     "ParseType":["bash", "magi", "go"],
        #     "Scenario":{"min":1,"max":500},
        #     "Constraints":{"min":0,"max":500}
        # }
        # errors = []

        # json_data = request.get_json(force=True)

        # # Check for valid input fields
        # for name in json_data:
        #     if name in EXPECTED:
        #         value = json_data[name]
        #         if(name == "ParseType"):
        #             if value not in EXPECTED[name]:
        #                 errors.append(f"Not Vaild Format, should be bash, magi or go.")
        #         else:
        #             expected_min = EXPECTED[name]['min']
        #             expected_max = EXPECTED[name]['max']
        #             if len(value) < expected_min or len(value) > expected_max:
        #                 errors.append(f"Out of bounds: {name}, has size of: {len(value)}, but should be between {expected_min} and {expected_max}.")
        #     else:
        #         errors.append(f"Unexpected field: {name}.")

        # # Check for missing input fields
        # for name in EXPECTED:
        #     if name not in json_data:
        #         errors.append(f"Missing value: {name}.")

        # if len(errors) <1:
            # Return parse
            tn = json_data['ParseType']
            scenario = json_data['Scenario']
            constraints = json_data['Constraints']

            if tn == 'bash':
                generator = bashGenerator(scenario=scenario, constraints=constraints,bindings=[])
            elif tn == 'magi':
                generator = bashGenerator(scenario=scenario, constraints=constraints,bindings=[]) # TODO: Use magi generator
            generator.parse()
            scenario_parsed, constraints_parsed = generator.scenario_parsed,generator.constraints_parsed
            print(scenario_parsed, constraints_parsed)
            return {"_id": str(uuid.uuid4()), "parsedScenario": scenario_parsed, "parsedConstraints": constraints_parsed}
        # else:
        #     # Return errors
        #     response = {"_id":str(uuid.uuid4()),"errors":errors}
        # return jsonify(response)

    def HandleGraphParse(self, scenarios):
        nodes = []
        edges = []
        t_events = defaultdict(list)
        e_events = defaultdict(list)
        all_any_flags = defaultdict(str)
        parser = HLBParser([])
        i = 0
        for scenario in scenarios:
            i += 1
            if scenario.startswith("@"):
                continue
            _t,v,_h = parser.extract_partial(scenario)
            v["id"] = str(i)
            if v["t_events"] is None:
                v["t_events"] = []
            if v["e_events"] is None:
                v["e_events"] = []
            nodes.append(v)

        for n in nodes:
            if n['e_events'] is not None:
                for e in n['e_events']:
                    e_events[e].append(n['id'])
            if n['t_events'] is not None:
                for e in n['t_events']:
                    if n['all_keyword'] is not None:
                        all_any_flags[n['id']] = 'all'
                    if n['any_keyword'] is not None:
                        all_any_flags[n['id']] = 'any'
                    t_events[e].append(n['id'])

        for e in e_events:
            j = 0
            for s in e_events[e]:
                for t in t_events[e]:
                    j += 1
                    edges.append({ 'id': e + str(j), 'source': s, 'target': t, 'label': e, 'data': {'all_or_any': all_any_flags[t] }})
        return nodes, edges

    def HandleTopologyParse(self,sceanrios,constraints):
        actors = dict()
        actor_list = []
        lans = []
        edges = []
        gen = bashGenerator(scenario=sceanrios,constraints=constraints,bindings=[])
        gen.generate()
        parsed_scenario, parsed_constraints = gen.scenario_parsed, gen.constraints_parsed
        #Get Features from Constraints
        actor_os = {}
        actor_ip = {}
        actor_nodetype = {}
        actor_interfaces = {}
        actor_num = {}
        for const in parsed_constraints:
            for act in const[1]:
                if act not in actor_list:
                    actor_list.append(act)
                if(const[0]=='config'):
                    for i in range(0, len(const[2]), 2):
                        if(const[2][i]=='os'):
                            actor_os[act]  = const[2][i+1]
                        if(const[2][i]=='ip'):
                            actor_ip[act] = const[2][i+1]
                        if(const[2][i]=='nodetype'):
                            actor_nodetype[act] = const[2][i+1]
                        if(const[2][i]=='interfaces'):
                            actor_interfaces[act] = const[2][i+1]
                        if(const[2][i]=='num'):
                            actor_num[act] = const[2][i+1]
                else:
                    continue

        for s in parsed_scenario:
            if s[1][0] not in actor_list:
                actor_list.append(s[1][0])
        
        for act in actor_list:
            if(act not in actor_os):
                actor_os[act] = 'default'
            if(act not in actor_ip):
                actor_ip[act] = 'default'
            if(act not in actor_nodetype):
                actor_nodetype[act] = 'default'
            if(act not in actor_interfaces):
                actor_interfaces[act] = 'default'
            if(act not in actor_num):
                actor_num[act] = 1

        for i in actor_list:
            actors[i] = dict({ 'num': str(actor_num[i]), 'os': actor_os[i], 'nodetype': actor_nodetype[i], 'ip': actor_ip[i], 'interfaces': actor_interfaces[i] })

        for i, const in enumerate(parsed_constraints):
            if const[0] is not None:
                if "link" in const[0]:
                    delay = 'default'
                    bw = 'default'
                    try:
                        for j in range(0, len(const[2]), 2):
                            if const[2][j] == 'bw':
                                bw = const[2][j+1]
                            elif const[2][j] == 'delay':
                                delay = const[2][j+1]
                    except:
                        pass
                    edges.append({ 'source': const[1][0], 'target': const[1][1], 'delay': delay, 'bw': bw })
                elif "lan" in const[0]:
                    delay = 'default'
                    bw = 'default'
                    try:
                        for j in range(0, len(const[2]), 2):
                            if const[2][j] == 'bw':
                                bw = const[2][j+1]
                            elif const[2][j] == 'delay':
                                delay = const[2][j+1]
                    except:
                        pass
                    nodeName = "lan" + str(i)
                    lans.append({ 'type' : 'lan', 'lineNum': i, 'actors': const[1]})
                    for n in const[1]:
                        edges.append({'source': n, 'target': nodeName, 'delay': delay, 'bw': bw})

        return actors, lans, edges

    def HandleTopologyNodeRename(self, old_name, new_name, constraints, scenarios):
        gen = bashGenerator(scenario=scenarios,constraints=constraints,bindings=[])
        gen.generate()
        parsed_constraints = gen.constraints_parsed
        parsed_scenarios = gen.scenario_parsed
        updated_constraints = []
        updated_scenarios = []

        scenario_parse_index = {
            "when": 0,
            "actor": 1,
            "action": 2,
            "emit": 3,
            "wait": 4
        }

        def generateScenarioSentence(scenario):
            sentence = []
            if scenario[scenario_parse_index["when"]] != None and len(scenario[scenario_parse_index["when"]]) != 0: #when
                sentence.append("when " + ", ".join(scenario[scenario_parse_index["when"]]))
            if scenario[scenario_parse_index["wait"]] != None: #when
                sentence.append("wait " + scenario[scenario_parse_index["wait"]])
            sentence.append(scenario[scenario_parse_index["actor"]][0]) #actor
            sentence.append(scenario[scenario_parse_index["action"]][0]) #action
            if scenario[scenario_parse_index["emit"]] != None: #emit
                sentence.append("emit " + ", ".join(scenario[scenario_parse_index["emit"]]))

            return " ".join(sentence)

        def generateConstrainSentence(constraint):
            def generateParameterSentence(parameters):
                if not parameters:
                    return ""
                return "[ " + ", ".join([parameters[i] + " " + parameters[i+1] for i in range(0,len(parameters), 2)]) + " ]"
            
            if constraint[0] in ['config']:
                return " ".join([" ".join(constraint[1]), generateParameterSentence(constraint[2])])
            elif constraint[0] in ['lan', 'link']:
                return " ".join([constraint[0], " ".join(constraint[1]), generateParameterSentence(constraint[2])])

        for constraint in parsed_constraints:
            for i in range(len(constraint[1])):
                if constraint[1][i] == old_name:
                    constraint[1][i] = new_name
            updated_constraints.append(generateConstrainSentence(constraint))

        for scenario in parsed_scenarios:
            for i in range(len(scenario[scenario_parse_index["actor"]])):
                if scenario[scenario_parse_index["actor"]][i] == old_name:
                    scenario[scenario_parse_index["actor"]][i] = new_name
            updated_scenarios.append(generateScenarioSentence(scenario))

        return updated_constraints, updated_scenarios

    def HandleTopologyGraphRemove(self, deleted_node, scenarios, bindings):

        gen = bashGenerator(scenario=scenarios,constraints="",bindings=[])
        gen.generate()
        parsed_scenarios = gen.scenario_parsed
        updated_scenarios = []
        updated_bindings = []

        scenario_parse_index = {
            "when": 0,
            "actor": 1,
            "action": 2,
            "emit": 3,
            "wait": 4
        }

        def generateScenarioSentence(scenario):
            sentence = []
            if scenario[scenario_parse_index["when"]] != None and len(scenario[scenario_parse_index["when"]]) != 0: #when
                sentence.append("when " + ", ".join(scenario[scenario_parse_index["when"]]))
            if scenario[scenario_parse_index["wait"]] != None: #when
                sentence.append("wait " + scenario[scenario_parse_index["wait"]])
            sentence.append(scenario[scenario_parse_index["actor"]][0]) #actor
            sentence.append(scenario[scenario_parse_index["action"]][0]) #action
            if scenario[scenario_parse_index["emit"]] != None: #emit
                sentence.append("emit " + ", ".join(scenario[scenario_parse_index["emit"]]))

            return " ".join(sentence)

        deleted_events = []
        deleted_actions = []
        filtered_parsed_scenarios = []
        
        #Filter scenarios and get all deleted events
        for scenario in parsed_scenarios:
            if deleted_node in scenario[scenario_parse_index["actor"]]:
                if scenario[scenario_parse_index["emit"]] != None:
                    deleted_events += scenario[scenario_parse_index["emit"]]
                deleted_actions += scenario[scenario_parse_index["action"]]
                continue
            filtered_parsed_scenarios.append(scenario)

        #remove all deleted events from when
        for scenario in filtered_parsed_scenarios:
            if scenario[scenario_parse_index["when"]] != None:
                for event in deleted_events:
                    if event in scenario[scenario_parse_index["when"]]:
                        scenario[scenario_parse_index["when"]].remove(event)
            updated_scenarios.append(generateScenarioSentence(scenario))
        
        #filter Bindings
        for binding in bindings:
            if binding["key"] not in deleted_actions and binding["key"] not in deleted_events:
                updated_bindings.append(binding)
                    
        return (updated_scenarios, updated_bindings)

    def HandleTopologyGraphGenerateConstraints(self, nodes, edges, parameters):

        def generateConstrainSentence(constraint):
            def generateParameterSentence(parameters):
                if not parameters:
                    return ""
                return "[ " + ", ".join([parameters[i] + " " + parameters[i+1] for i in range(0,len(parameters), 2)]) + " ]"
            
            if constraint[0] in ['config']:
                return " ".join([" ".join(constraint[1]), generateParameterSentence(constraint[2])])
            elif constraint[0] in ['lan', 'link']:
                return " ".join([constraint[0], " ".join(constraint[1]), generateParameterSentence(constraint[2])])

        node_parameters = {
            "operatingSystem": "os",
            "hardwareType": "nodetype",
            "ipAddress": "ip",
            "num": "num"
        }

        edge_parameters = {
            'bandwidth': 'bw',
            'delay': 'delay'
        }

        lan_parameters = {
            'bandwidth': 'bw',
            'delay': 'delay'
        }

        lans = {}
        nodes_group_by_param = defaultdict(set)
        nodes_by_id = dict((str(v),k) for (k,v) in nodes.items())

        for (id, properties) in parameters.items():
            if properties["type"] == 0: #Node
                #Group nodes by their properties
                for (prop, value) in properties.items():
                    if prop in node_parameters and value != "":
                        # if prop == "num" and value == "1":
                        #     continue
                        nodes_group_by_param[(node_parameters[prop], value)].add(id)
            elif properties["type"] == 1: #Edge
                #Do nothing
                pass
            elif properties["type"] == 2: #LAN
                #Store node in LANs and set it properties
                lans[id] = {"nodes": [], "parameters": []}
                for (prop, value) in properties.items():
                    if prop in lan_parameters and value != "":
                        lans[id]["parameters"] += [lan_parameters[prop], value]
                nodes_by_id.pop(id)

        # Group the params by set of nodes
        param_group_by_node = defaultdict(list)
        for (param, node_set) in nodes_group_by_param.items():
            node_hash = tuple(sorted(list(node_set)))
            param_group_by_node[node_hash] += list(param)

        constraints = []

        #Add node properties to constrains
        for (node_list, param) in param_group_by_node.items():
            constraints.append(generateConstrainSentence(('config', list(map(lambda x: nodes_by_id[x], node_list)), param)))

        #Add link and its parametes to constrains
        for (_, edge) in edges.items():
            edge["from"] = str(edge["from"])
            edge["to"] = str(edge["to"])
            edge["id"] = str(edge["id"])

            if edge["from"] in nodes_by_id and edge["to"] in nodes_by_id: #Filter edges connected to LANs
                params = []
                for (prop, value) in parameters[edge["id"]].items():
                    if prop in edge_parameters and value != "":
                        params += [edge_parameters[prop], value]
                constraints.append(generateConstrainSentence(('link', [nodes_by_id[edge["from"]], nodes_by_id[edge["to"]]], params)))
            else: #Add node to lan
                lan_id, node_id = (edge["from"], edge["to"]) if edge["from"] in lans else (edge["to"], edge["from"])
                lans[lan_id]["nodes"].append(nodes_by_id[node_id])

        #Add LAN to constrains
        for lan_prop in lans.values():
            if len(lan_prop["nodes"]) >= 1:
                constraints.append(generateConstrainSentence(('lan', lan_prop["nodes"], lan_prop["parameters"])))

        return constraints

    def HandleDependencyGraphHasCycle(self, scenarios):
        gen = bashGenerator(scenario=scenarios,constraints="",bindings=[])
        gen.generate()
        parsed_scenarios = gen.scenario_parsed

        scenario_parse_index = {
            "when": 0,
            "actor": 1,
            "action": 2,
            "emit": 3,
            "wait": 4
        }

        emit_map = {}
        when_map = {}

        graph_nodes = set()

        for scenario in parsed_scenarios:
            node = (scenario[scenario_parse_index["actor"]][0],scenario[scenario_parse_index["action"]][0])
            graph_nodes.add(node)
            emit_event = scenario[scenario_parse_index["emit"]]
            if(emit_event != None):
                emit_map[node] = emit_event[0]

            when_events = scenario[scenario_parse_index["when"]]
            if when_events != None:
                for when_event in when_events:
                    if when_event not in when_map:
                        when_map[when_event] = set()
                    when_map[when_event].add(node)

        def hasCycle(node, visited, stack):

            visited[node] = True
            stack.append(node)

            emit_event = emit_map.get(node, None)
            if emit_event != None:
                adjacent_nodes = when_map.get(emit_event, [])
                for adjacent_node in adjacent_nodes:
                    if visited[adjacent_node] == False:
                        path = hasCycle(adjacent_node, visited, stack)
                        if path != None:
                            return path
                    elif adjacent_node in stack:
                        return stack[stack.index(adjacent_node):]

            stack.pop()
            return None

        visited_nodes = dict([(node, False) for node in graph_nodes])
        stack_nodes = []

        for node in graph_nodes:
            if visited_nodes[node] == False:
                path = hasCycle(node, visited_nodes, stack_nodes)
                if path != None:
                    return path
        return None

    def HandleDependencyGraphNodeDelete(self, actor, action, scenarios, bindings):
        gen = bashGenerator(scenario=scenarios,constraints="",bindings=[])
        gen.generate()
        parsed_scenarios = gen.scenario_parsed
        updated_scenarios = []
        updated_bindings = []

        scenario_parse_index = {
            "when": 0,
            "actor": 1,
            "action": 2,
            "emit": 3,
            "wait": 4
        }

        def generateScenarioSentence(scenario):
            sentence = []
            if scenario[scenario_parse_index["when"]] != None and len(scenario[scenario_parse_index["when"]]) != 0: #when
                sentence.append("when " + ", ".join(scenario[scenario_parse_index["when"]]))
            if scenario[scenario_parse_index["wait"]] != None: #when
                sentence.append("wait " + scenario[scenario_parse_index["wait"]])
            sentence.append(scenario[scenario_parse_index["actor"]][0]) #actor
            sentence.append(scenario[scenario_parse_index["action"]][0]) #action
            if scenario[scenario_parse_index["emit"]] != None: #emit
                sentence.append("emit " + ", ".join(scenario[scenario_parse_index["emit"]]))

            return " ".join(sentence)

        deleted_events = []
        filtered_parsed_scenarios = []
        
        #Filter scenarios and get all deleted events
        for scenario in parsed_scenarios:
            if actor in scenario[scenario_parse_index["actor"]] and action in scenario[scenario_parse_index["action"]]:
                if scenario[scenario_parse_index["emit"]] != None:
                    deleted_events += scenario[scenario_parse_index["emit"]]
                continue
            filtered_parsed_scenarios.append(scenario)

        #remove all deleted events from when
        for scenario in filtered_parsed_scenarios:
            if scenario[scenario_parse_index["when"]] != None:
                for event in deleted_events:
                    if event in scenario[scenario_parse_index["when"]]:
                        scenario[scenario_parse_index["when"]].remove(event)
            updated_scenarios.append(generateScenarioSentence(scenario))
        
        #filter Bindings
        for binding in bindings:
            if binding["key"] not in action and binding["key"] not in deleted_events:
                updated_bindings.append(binding)
                    
        return (updated_scenarios, updated_bindings)
     
    def HandleDependencyGraphUpdateEdge(self, update_type, actor_from, action_from, actor_to, action_to, scenarios, bindings):
        gen = bashGenerator(scenario=scenarios,constraints="",bindings=[])
        gen.generate()
        parsed_scenarios = gen.scenario_parsed
        updated_scenarios = []
        updated_bindings = bindings

        scenario_parse_index = {
            "when": 0,
            "actor": 1,
            "action": 2,
            "emit": 3,
            "wait": 4
        }

        def generateScenarioSentence(scenario):
            sentence = []
            if scenario[scenario_parse_index["when"]] != None and len(scenario[scenario_parse_index["when"]]) != 0: #when
                sentence.append("when " + ", ".join(scenario[scenario_parse_index["when"]]))
            if scenario[scenario_parse_index["wait"]] != None: #when
                sentence.append("wait " + scenario[scenario_parse_index["wait"]])
            sentence.append(scenario[scenario_parse_index["actor"]][0]) #actor
            sentence.append(scenario[scenario_parse_index["action"]][0]) #action
            if scenario[scenario_parse_index["emit"]] != None: #emit
                sentence.append("emit " + ", ".join(scenario[scenario_parse_index["emit"]]))

            return " ".join(sentence)

        event_name = actor_from + "Run" + action_from + "Sig"

        #Add event name to from if no emit exists
        for i in range(len(parsed_scenarios)):
            scenario = list(parsed_scenarios[i])
            if actor_from in scenario[scenario_parse_index["actor"]] and action_from in scenario[scenario_parse_index["action"]]:
                emit_events = scenario[scenario_parse_index["emit"]]
                if emit_events == None: #Add new event name
                    emit_events = [event_name]
                    scenario[scenario_parse_index["emit"]] = emit_events
                else: #Get existing event name
                    event_name = emit_events[0]
                parsed_scenarios[i] = tuple(scenario)
                break
          
        #Remove/Insert the event from the dependent action
        for scenario in parsed_scenarios:
            scenario = list(scenario)
            if actor_to in scenario[scenario_parse_index["actor"]] and action_to in scenario[scenario_parse_index["action"]]:
                when_events = scenario[scenario_parse_index["when"]]
                if update_type == "REMOVE": #Remove event
                    when_events.remove(event_name)
                else: #Add event
                    if when_events == None:
                        when_events = []
                    when_events.append(event_name)
                scenario[scenario_parse_index["when"]] = when_events
            updated_scenarios.append(generateScenarioSentence(scenario))

        if update_type == "INSERT":
            #Check if cycle exists
            cycle_path = self.HandleDependencyGraphHasCycle(updated_scenarios)
            if cycle_path != None:
                return(scenarios, bindings, event_name, cycle_path)
            pass

        return (updated_scenarios, updated_bindings, event_name, None)

    def HandleDependencyGraphGetNodeCount(self, constraints, scenarios, bindings):
        gen = bashGenerator(scenario=scenarios,constraints=constraints,bindings=bindings)
        gen.generate()
        labelScript = gen.run
        
        nodeCountData = defaultdict(int)
        for (_, script) in labelScript.items():
            commands = script.split("\n")

            for command in commands:
                if command.startswith("execute_fork") and command[-1] == "&":
                    nodeCountData[command.split(" ")[-2]] += 1

        return nodeCountData

    #Handle generateNS
    def HandleNS(self,json_data):
        errors = []
        actors = json_data['actors']
        scenario = json_data['behaviors']
        constraints = json_data['constraints']
        bindings = json_data['bindings']
        generator = nSGenerator(constraints=constraints, scenario=scenario, bindings=bindings)
        generator.generate()
        ns_script = generator.run['main']
        return ns_script

    #Handle generateMergeTB
    def HandleMergeTB(self,json_data):
        errors = []
        actors = json_data['actors']
        scenario = json_data['behaviors']
        constraints = json_data['constraints']
        bindings = json_data['bindings']
        experiment_name = json_data['name']
        generator = mergeTBGenerator(constraints=constraints, scenario=scenario, bindings=bindings, experimentName=experiment_name)
        generator.generate()
        mergeTB_script = generator.run['main']
        return mergeTB_script

    #Handle generateBASH
    def HandleBASH(self,json_data,mode=None):
        errors = []
        parameterlist = dict()
        actors = json_data['actors']
        scenario = json_data['behaviors']
        constraints = json_data['constraints']
        bindings = json_data['bindings']
        generator = bashGenerator(constraints=constraints, scenario=scenario, bindings=bindings)
        generator.generate(mode)
        bash_script = []
        for label in generator.run.keys():
            labelDetail = dict()
            labelDetail['label'] = label
            labelDetail['run'] = dict()
            labelDetail['run']['fileName'] = 'run_'+label+'.sh'
            labelDetail['run']['content'] = generator.run[label]
            labelDetail['clean'] = dict()
            labelDetail['clean']['fileName'] = 'cleanup_'+label+'.sh'
            labelDetail['clean']['content'] = generator.clear[label]
            variables = []
            for e in generator.evars[label]:
                variables.append({"variable":e[0],"message":e[1]})
            labelDetail['variables'] = variables
            
            bash_script.append(labelDetail)
        
        return bash_script
    
    #Handle generateDAS
    def HandleDAS(self,json_data):
        errors = []
        parameterlist = dict()
        actors = json_data['actors']
        scenario = json_data['behaviors']
        constraints = json_data['constraints']
        bindings = json_data['bindings']
        generator = dasGenerator(constraints=constraints, scenario=scenario, bindings=bindings)
        generator.generate(None)
        das_script = []
        for label in generator.run.keys():
            labelDetail = dict()
            labelDetail['label'] = label
            labelDetail['run'] = dict()
            labelDetail['run']['fileName'] = 'run_'+label+'.sh'
            labelDetail['run']['content'] = generator.run[label]
            labelDetail['clean'] = dict()
            labelDetail['clean']['fileName'] = 'cleanup_'+label+'.sh'
            labelDetail['clean']['content'] = generator.clear[label]
            variables = []
            for e in generator.evars[label]:
                variables.append({"variable":e[0],"message":e[1]})
            labelDetail['variables'] = variables
            
            das_script.append(labelDetail)
        
        return das_script

    
