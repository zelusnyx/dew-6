import sys, os, uuid
sys.path.append('./DewFunctions/Generators/')
sys.path.append('./DewFunctions/Generators/bash')
sys.path.append('./DewFunctions/UI/HighLevelBehaviorLanguage/')
sys.path.append('./DewFunctions/UI/')
sys.path.append('./DewFunctions/Translators/bash')
sys.path.append('./DewFunctions/Translators/magi')
import globals
import hlb
import re
from parsebash import GeneralParseBash
from generator import GeneralGenerator
from generator import GeneralGenerator
from bash import Generator as bashGenerator
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
        for event in events:
            s,t = hlb.getSuggestionsForEvent(event)
            suggestions = suggestions + s
            suggestion_text = suggestion_text + t
        return suggestions, suggestion_text

    def HandleConstraintSuggestions(self, constraints, actors, last_constraint, scenarios):
        suggestions = []
      
        items = re.split("[\s,]",last_constraint.strip())
        item = items.pop(0)
        if item in ["num", "os","nodetype", "interfaces", "location", "ip",  "link","lan"] and len(items) == 0:
            return actors
        elif len(items) >= 1:
            if (item == "num" or item == "interfaces") and items[-1] in actors:
                return self.addSuggestions(["enter digit"])
            elif item == "os" and (items[-1] in actors):
                # for os in globals.deploy_handler.getSuggestions(type='os'):
                    #addSuggestions(os, Centry)
                    # globals.app.addButton(os,Centry)
                    # globals.sbuttons[os]=1
                return self.addSuggestions(["enter OS"])
            elif item == "nodetype" and (items[-1] in actors):
                # for nodetype in globals.deploy_handler.getSuggestions(type='nodetype'):
                #     globals.app.addButton(nodetype,Centry)
                #     globals.sbuttons[nodetype]=1
                return self.addSuggestions(["enter node type"])
            elif item == "link" and (items[-1] in actors):
                return self.addSuggestions(["actors_only"])
            elif item == "lan" and (items[-1] in actors):
                return self.addSuggestions(["actors_only"])
            elif item == "location" and (items[-1] in globals.actors):
                return self.addSuggestions(["enter testbed"])
            elif item == "ip" and (items[-1] in globals.actors):
                return self.addSuggestions(["enter IP address"])
            else:
               return self.addSuggestions(["constraints_enter"])
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
                generator = bashGenerator(scenario, constraints=constraints)
            elif tn == 'magi':
                generator = bashGenerator(scenario, constraints=constraints) # TODO: Use magi generator

            # cwd = os.path.dirname(os.path.realpath(__file__))
            # # print(cwd)
            # if os.path.isdir(cwd + "/DewFunctions/Generators/" + tn):
            #     sys.path.append(cwd + "/DewFunctions/Generators/" + tn)
            # else:
            #     print("\nERROR:\tExpecting generator type (%s) to match {generator}/{generator}.py\n\t(e.g. %s/%s.py) in %s/ directory.\n\n" %(tn, tn, tn, cwd))
            #     print("\n")
            #     exit(1)

            # chosenGenerator = __import__(tn, fromlist=['Generator'])
            # generator = chosenGenerator.Generator(scenario, constraints=constraints)
            scenario_parsed, constraints_parsed = generator.generate()
            print(scenario_parsed, constraints_parsed)
            return {"_id": str(uuid.uuid4()), "parsedScenario": scenario_parsed, "parsedConstraints": constraints_parsed}
        # else:
        #     # Return errors
        #     response = {"_id":str(uuid.uuid4()),"errors":errors}
        # return jsonify(response)


    #Handle generateNS
    def HandleNS(self,json_data):

        # EXPECTED = {
        #     "Actors":{"min":1,"max":500},
        #     "Scenario":{"min":1,"max":500},
        #     "Constraints":{"min":0,"max":500},
        #     "Bindings":{"min":0,"max":500}
        # }
        errors = []
        tn = json_data['ParseType']
        scenario = json_data['Scenario']
        constraints = json_data['Constraints']
        actors = json_data['actors']

        if tn == 'bash':
            generator = bashGenerator(scenario, constraints=constraints)
        elif tn == 'magi':
            generator = bashGenerator(scenario, constraints=constraints) # TODO: Use magi generator


        scenario_parsed, constraints_parsed = generator.generate()
        ns_script = generator.generateNS(constraints_parsed, actors)
        return ns_script
        # Check for valid input fields
        # for name in json_data:
        #     if name in EXPECTED:
        #         value = json_data[name]
        #         expected_min = EXPECTED[name]['min']
        #         expected_max = EXPECTED[name]['max']
        #         if len(value) < expected_min or len(value) > expected_max:
        #             errors.append(f"Out of bounds: {name}, has size of: {len(value)}, but should be between {expected_min} and {expected_max}.")
        #     else:
        #         errors.append(f"Unexpected field: {name}.")

        # # Check for missing input fields
        # for name in EXPECTED:
        #     if name not in json_data:
        #         errors.append(f"Missing value: {name}.")

        #ns_script = "set ns [new Simulator]\nsource tb_compat.tcl\n# Nodes\nforeach node {\n"

        #for actor in json_data['actors']:
        #    ns_script += "\t" + actor + "\n"
        #ns_script += "} {\n\tset $node [$ns node]\n\ttb-set-node-os $node Ubuntu-STD\n}\nset lan0 [$ns make-lan \""
        #for a in json_data['actors']:
        #    ns_script += "$" + a + " "
        #ns_script += "\" 100000.0kb 0.0ms]\n\n$ns rtproto Static\n$ns run"
        #return ns_script
