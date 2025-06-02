# XXX We need to redo the directory structure so core functions (like Scenario parsing) are more central.
# In the meantime:
import os.path
import sys
import configparser
import unicodedata

# cwd = os.path.dirname(os.path.realpath(__file__))
# parentDir = os.path.abspath(os.path.join(cwd, os.pardir))
# # print(parentDir + '/UI/HighLevelBehaviorLanguage/')
# sys.path.insert(0, parentDir + '/UI/HighLevelBehaviorLanguage/')
# sys.path.insert(0, parentDir + '/UI/')


sys.path.append('../UI/HighLevelBehaviorLanguage/')
sys.path.append('../UI/')

import globals
import ast
import re

from hlb_parser import HLBParser, ConstraintParser, BindingParser

class Generator(object):
    # scenario and constraints given as a list.
    def __init__(self,   constraints, scenario, bindings, experimentName='', inputFileName=None,name='Generic Class'):

        self.constraints = constraints
        self.scenario = scenario
        self.bindings = bindings
        self.experimentName = experimentName
       
        # For debugging. Subclass should set this to something meaningful. e.g. "bash"
        self.name = name
        
        # Imported from hlb_parser.
        self.HLBparser = HLBParser(globals.actors)
        self.ConstParser = ConstraintParser()
        self.BindParser = BindingParser()

        # After we parse statements, we store them as a list of tuples (one tuple per statement).
        self.scenario_parsed = []
        self.constraints_parsed = []
        self.bindings_parsed = {}
        self.run = dict()
        self.tmp = dict()
        self.clear = dict()
        self.actors = dict()

    def parse(self, mode=None):
        # For each item in our scenario/constraints lists, make sure we can parse it and
        # turn it into tuplets.
        # Scenario -> ['trigger events', 'actors', 'action', 'emit events', 'wait time']
        # (note, some of these can be None)

        # Constraints -> ['constraint type', 'target', 'value' ] (some of these can be None)
        myc = ""
        for c in self.constraints:
            c = unicodedata.normalize("NFKD", c)
            myc += c + "\n"
            # c = co[0]
            try:
                parsedTuple = self.ConstParser.parse_stmt(c)
            except:
                print("ERROR:\tCannot parse the following constraint: %s\n" % c)
                continue
                # return False
            # Because we use parsing for UI suggestions, we don't throw exceptions
            # when we can't parse a statement, instead the parser returns a tuplet of Nones.
            if all(x == None for x in parsedTuple):
                print("ERROR:\tUnparsable constraint: %s\n" % repr(c))
                continue
                #return False

            # XXX Right now, for generation we only care about 'num' constraints.
            # XXX At some point we may care about others, like 'os'.
            #if 'num' == parsedTuple[0]:
            self.constraints_parsed.append(parsedTuple)

        mys = ""
        label = "main"
        for s in self.scenario:
            s = unicodedata.normalize("NFKD", s)
            mys += s + "\n"
            # s = sc[0]
            try:
                parsedTuple = self.HLBparser.parse_stmt(s)
            except:
                print("ERROR:\tCannot parse the following Scenario statement: %s\n" % s)
                continue
                # return False
            # See above comment - we return all Nones if statement is un-parsable.
            if all(x == None for x in parsedTuple):
                print("ERROR:\tUnparsable Scenario statement: %s\n" % s)
                continue
                #return False
            if (parsedTuple[-1] is not None):
                label = parsedTuple[-1]
            else:
                newparsedTuple = (parsedTuple[0], parsedTuple[1], parsedTuple[2], parsedTuple[3], parsedTuple[4], parsedTuple[5], parsedTuple[6],  label)
                self.scenario_parsed.append(newparsedTuple)

        myb = ""
        for bi in self.bindings:
            b = bi['key'] + " " + bi['value']
            myb += bi['key'] + " = " + bi['value'] + "\n"
            try:
                key,value = self.BindParser.parse_stmt(b)
            except:
                print("ERROR:\tCannot parse the following Scenario statement: %s\n" % b)
                continue
                # return False
            # See above comment - we return all Nones if statement is un-parsable.
            if key == None or value == None:
                print("ERROR:\tUnparsable Bindings statement: %s\n" % b)
                continue
                # return False
            self.bindings_parsed[key] = value
            
        self.dew = "[Scenario]\n" + mys + "\n[Constraints]\n" + myc + "\n[Bindings]\n" + myb

    def generate(self, mode=None):
        # Parse scenario, constraints and bindings
        self.parse()
