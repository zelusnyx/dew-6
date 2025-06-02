import os
import re
import sys

class GeneralParseBash(object):
    def parse(data):
        actors = {}
        # usage = "Usage: " + str(sys.argv[0]) + " bash_script\n"
        started = {}
        actions = {}
        loopvars = {}

        dewOutTemp = []
        dewOutScenario = []
        dewOutConstraints = []
        dewOutBindings = []

        # if (len(sys.argv) < 2):
        #     print (usage)
        #     sys.exit(1)

        # filepath = sys.argv[1]
        ti = 0
        trigger = ""
        event = ""
        emit = ""
        na = 0
        linecount = 0

        # cwd = os.path.dirname(os.path.realpath(__file__))
        # baseFileName = re.sub("\.[a-z]+", "", filepath.split('/')[-1])
        # outFile = open(cwd + "/out/" + baseFileName + ".dew", 'w+')

        # outFile.write("[Scenario]\n")
        dewOutTemp.append("[Scenario]\n")

        #with open(filepath, 'r+') as fh:
        for line in data.split('\n'):
            linecount += 1
            line = re.sub("^\s+", "", line)
            line = re.sub("\s+$", "", line)

            # Get loop variable initialization
            # Each loop variable is put into a dictionary { 'var1' : [start, end]
            #                                               'var2' : [start, end]
            #                                               ... }
            # This step will get a variable and its start value
            if re.search("^[a-z]\s*=\s*\d", line):
                items = line.split("=")
                var = items[0].strip()
                value = int(items[1].strip())
                if var not in loopvars.keys():
                    loopvars[var] = [None] * 2
                    loopvars[var][0] = value

            # Get loop control value
            # Currently supports 'while' loop syntax
            # This step will get the end value of a loop variable that was saved to the dictionary during initialization
            if re.search("^while", line):
                line = re.sub("^while\s*\[\s*\$", "", line)
                line = re.sub("\s*\].*", "", line)
                line = re.sub("\$", "", line)
                items = line.split()
                var = items[0].strip()
                value = int(items[2].strip())
                if items[1] == '-lt':
                    value -= 1
                if var not in loopvars.keys():
                    print ("ERROR: Line %d - variable $%s not initialized before while loop" % (linecount, var))
                    sys.exit(1)
                else:
                    loopvars[var][1] = int(value)

            actor = ""
            if re.search("^ssh", line):
                items = line.split()
                items.pop(0)
                for item in items:
                    if re.search("^\-", item):
                        items.pop(0)
                    else:
                        # Check if the command is using a variable for attacker number
                        # If so, then check if this variable is unique (ie. no other variable has the same start and end)
                        # If another variable does have the same [start, end], we assume that these variables are actually
                        #   referring to the same actor
                        # Replace new variable with the old variable used for this same actor in a previous loop
                        match = re.search("\$[a-z]{1}\.", item)
                        if match:
                            var = match.group(0)[1:2]
                            for oldvar, value in loopvars.items():
                                if oldvar != var and value == loopvars[var]:
                                    item = re.sub("\$[a-z]{1}\.", "$" + oldvar + ".", item)
                        if item not in actors.keys():
                            actors[item] = na
                            na += 1
                        actor = item
                        break

                if not re.search("\&$", line):
                    emit = "emit"
                else:
                    emit = ""

                # Find the command
                chars = list(line)
                start = -1
                end = -1
                for i in range(0, len(chars)):
                    if (chars[i] == "\""):
                        start = i
                        break

                for i in range(len(chars)-1, 0, -1):
                    if (chars[i] == "\""):
                        end = i
                        break

                cmd = line[start+1 : end]
                cmds = re.split("\;|\&\&", cmd)
                action = ""

                for cm in cmds:
                    # Drop sudo if it's there
                    cm = re.sub("sudo", "", cm)
                    cm = re.sub("^\s+", "", cm)
                    cm = re.sub("\s+$", "", cm)

                    # This is what we want, would like to have just a path to script but can add later
                    if re.search("^sh|^bash|^perl|^python", cm):
                        words = cm.split()
                        action = words[1]
                        parts = action.split("/")
                        action = parts[-1]
                        #remember what was started with this interpreter
                        if words[0] not in started:
                            started[words[0]] = []
                        started[words[0]].append(action)
                        break

                    elif re.search("^sleep", cm):
                        trigger = "wait t" + str(ti)
                        ti += 1

                    elif re.search("^kill|^pkill|^killall", cm):
                        killed = ""
                        words = cm.split()
                        if re.search("^kill|^pkill", cm):
                            prog = words[-1]
                        else:
                            prog = words[1]

                        if prog in started:
                            for a in started[prog]:
                                if killed != "":
                                    killed += ", "
                                killed += a

                        if killed == "":
                            killed = prog

                        parts = killed.split("/")
                        killed = parts[-1]
                        killed = re.sub("^start_", "", killed)
                        action = "stop_" + killed
                        break

                    elif not re.search("cd", cm):
                        words = cm.split()
                        parts = words[0].split("/")
                        action = parts[-1]
                        break

                action = re.sub("\..*$", "", action)
                tempScenario = ""
                if action != "":

                    # Check if this action name has been used before; and, if the command is new or has been seen before.
                    # If the action is the same, but the command is unique, then concat a number to the action to make it
                    #       unique.
                    # This is to ensure that dictionary entries in 'actions' are not overwritten. For example, if a 'mkdir'
                    #       appears multiple times to make unique folders, then there will be 'mkdir' and 'mkdir_2'
                    if action in actions and cmd != actions[action][1]:
                        actions[action][0] += 1
                        action += '_' + str(actions[action][0])
                        actions[action] = [1, cmd]
                    else:
                        actions[action] = [1, cmd]

                    if event != "":
                        temp = "when " + event

                        if trigger != "":
                            temp = temp + " " + trigger
                        trigger = temp
                        event = ""

                    if emit != "":
                        event = action + "_done"

                    if trigger != "":
                        # outFile.write(trigger + " ")
                        dewOutTemp.append(trigger + " ")
                        tempScenario += trigger + " "

                    # outFile.write("actor" + str(actors[actor]) + " " + action + " ")
                    dewOutTemp.append("actor" + str(actors[actor]) + " " + action + " ")
                    tempScenario += "actor" + str(actors[actor]) + " " + action + " "

                    if emit != "":
                        # outFile.write(emit + " " + event)
                        dewOutTemp.append(emit + " " + event)
                        tempScenario += emit + " " + event
                    # outFile.write("\n")
                    dewOutTemp.append("\n")
                    dewOutScenario.append(tempScenario)

                    if trigger != "":
                        trigger = ""
                    else:
                        event = ""

            if re.search("^sleep", line):
                trigger = "wait t" + str(ti)
                ti += 1

        # outFile.write("\n")
        # outFile.write("[Constraints]\n")

        dewOutTemp.append("\n")
        dewOutTemp.append("[Constraints]\n")

        # TODO next step is to add support for numbered constraints. After that we can add support for other constraint types

        # outFile.write("\n")
        # outFile.write("[Bindings]\n")

        dewOutTemp.append("\n")
        dewOutTemp.append("[Bindings]\n")

        for a in sorted(actions):
            # outFile.write(a + " " + actions[a][1] + "\n")
            dewOutTemp.append(a + " " + actions[a][1] + "\n")
            dewOutBindings.append(a + " " + actions[a][1])

        # outFile.close()
        # self.dewOut = ''.join(dewOutTemp)
        return ''.join(dewOutTemp), dewOutScenario, dewOutConstraints, dewOutBindings, 

