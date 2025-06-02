import configparser, sys
from ensurepip import version
sys.path.append('./DewFunctions/UI/HighLevelBehaviorLanguage/')
from hlb_parser import HLBParser, ConstraintVersionOneParser, ConstraintParser

class DEWParser(object):
    def get_behaviors_and_constraints(self, dew_text):
        config = configparser.ConfigParser(allow_no_value=True)
        config.optionxform = str
        config.read_string(dew_text)
        behaviors = [key for key in config['Scenario']]
        constraints = [key for key in config['Constraints']]
        bindings = [(key, config.get('Bindings', key)) for key in config['Bindings']]
        actors = self.extract_actors(behaviors)
        return {'behaviors': behaviors, 'constraints': constraints, 'bindings': bindings, 'actors': actors}
    
    def extract_actors(self, behaviors):
        actors = set()
        hlbparser = HLBParser(actors)
        for behavior in behaviors:
            print(hlbparser.parse_stmt(behavior))
            type,vals,hints = hlbparser.extract_partial(behavior)
            print(vals, hints, type, behavior)
            if "actors" in vals and vals["actors"] != None:
                actors = actors.union(vals["actors"])
        return actors
    
    def convert_DEW_1_to_2(self, constraints):
        parsed_constraints = []
        constraintParser = ConstraintVersionOneParser()
        actorParam = {}
        converted_constraints = []
        index = 0
        for line in constraints:
            parsed_constraints.append(constraintParser.parse_stmt(line))
            if(parsed_constraints[index][0] not in ['link', 'lan']):
                try:
                    actorParam[parsed_constraints[index][1][0]]
                except:
                    actorParam[parsed_constraints[index][1][0]] = {}
                actorParam[parsed_constraints[index][1][0]][parsed_constraints[index][0]] = str(parsed_constraints[index][2][0])
            else:
                converted_constraints.append(constraints[index])
            index = index + 1
        for key in actorParam.keys():
            temp = key + " [ "
            for nestedKey in actorParam[key].keys():
                temp = temp + nestedKey + " " + actorParam[key][nestedKey] + ", "
            temp = temp[:-2]
            temp = temp + " ]"
            converted_constraints.append(temp)
        return converted_constraints

    def dew_version_detector(self, constraints):
        version = -1
        constraintParsers = [ConstraintVersionOneParser(), ConstraintParser()] 
        for index,parser in enumerate(constraintParsers):
            try:
                for line in constraints:
                    parsed_stmt = parser.parse_stmt(line)
                    if (all(item is None for item in parsed_stmt)):
                        raise Exception()
                version = index + 1
            except:
                pass
        return version
        