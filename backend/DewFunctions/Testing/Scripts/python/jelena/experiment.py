#!/usr/bin/env python
"""
    Runs the deterdemo. 

    Command Line Usage:
        experiment [options] scenarioID legduration attackduration


    Options:
        -h                  Show usage and exit
        -v , -V             Verbose levels

"""


import os
import sys
import getopt
import logging
import time
import string

from configure import thinnernode, victimnode, goodnodes, attacknodes, DEMOPATH, TOOLSPATH, CLIENT_BW, GAP, LOGFILE, ipdict, runBgCmd, runCmd, remoteExec, remoteBgExec, scenario

if not "control" == os.environ['HOST'].split('.',1)[0]:
    sys.exit("The script should run on control\n")


#---- global data
log = logging.getLogger("experiment")


def run_payment(node, victimip, paymentrate, paymentduration):
    
    nodeip = ipdict[node]
    cmd = "sudo " + TOOLSPATH + "/payment/payment " + nodeip + " " + victimip +\
        " 1000 " + str(paymentrate) + " 0 3 " + str(paymentduration)
    remoteBgExec(node, cmd)

#--- module API

def experiment(legtraffic_on, attacktraffic_on, defcom_on, offense_on, legitduration, attackduration):
    
    # Create the log file
    runCmd("rm -rf " + LOGFILE + "; sudo touch " + LOGFILE + "; sudo chmod 777 " + LOGFILE)

    ########### LOAD AND START DEFENSE #######################################
    if defcom_on :
        cmd = "python loaddefense.py"
        runCmd(cmd)

    ############ START LEGITIMATE TRAFFIC #####################################
    
    if legtraffic_on :
        goodclients = ""
        if len(goodnodes) >= 1:
            goodclients = goodnodes[0]
            for i in range(1, len(goodnodes)):
                goodclients = goodclients + " " + goodnodes[i]

            sys.stdout.write("Start legitimate traffic from %s\n" % goodclients)
            cmd = "sudo python " + DEMOPATH + "/legtraffic.py " +\
                    + str(legitduration)
            runBgCmd(cmd)


    ############ START ATTACK TRAFFIC #####################################
    if attacktraffic_on :
        attackclients = ""
        if len(attacknodes) >= 1:
            time.sleep(GAP)
            attackclients = attacknodes[0]
            for i in range(1, len(attacknodes)):
                attackclients = attackclients + " " + attacknodes[i]

            sys.stdout.write("Start Attack traffic from %s\n" % attackclients)
            cmd = "python " + DEMOPATH + "/dostraffic.py " +\
                    str(attackduration)
            #cmd = "sudo python " + DEMOPATH + "/floodtraffic.py " +\
            #        victimnode + " " + str(attackduration) + " " + attackclients
            runBgCmd(cmd)

    if offense_on :
        legitpaymentrate = int(CLIENT_BW * 8 * 0.8)
        for node in goodnodes:
            sys.stdout.write("Start legitimate payment from %s\n" % node)
            run_payment(node, ipdict[victimnode], legitpaymentrate, attackduration)

        #attackpaymentrate = int(CLIENT_BW * 8 * 0.01)
        #for node in attacknodes:
        #    sys.stdout.write("Start attack payment from %s\n" % node)
        #    run_payment(node, ipdict[victimnode], attackpaymentrate, attackduration)

    #### wait for the traffic to finish
    time.sleep(legitduration + 10)

    ################# SHUTDOWN DefCOM #####################################
    if defcom_on :
        cmd = "python stopdefense.py"
        runCmd(cmd)

#---- mainline

def main(argv):
    ch = logging.StreamHandler()
    log.addHandler(ch)

    try:
        optlist, args = getopt.getopt(argv[1:], 'hvV')
    except getopt.GetoptError, msg:
        sys.stderr.write("See 'experiment -h'.\n")
        return 1

    if len(args) != 3:
        sys.stdout.write(__doc__)
        return 1
    else:
        scenarioID = int(args[0])
        legitduration = int(args[1])
        attackduration = int(args[2])

    for opt, optarg in optlist:
        if opt == '-h':
            sys.stdout.write(__doc__)
            return 0
        elif opt == '-v':
            log.setLevel(logging.INFO)
        elif opt == '-V':
            log.setLevel(logging.DEBUG)

    legtraffic_on, attacktraffic_on, defcom_on, offense_on = scenario(scenarioID)
    try:
        experiment(legtraffic_on, attacktraffic_on, defcom_on, offense_on, legitduration, attackduration)
    except Exception, ex:
        sys.stderr.write("experiment: Error %s\n" % str(ex) ) 
        return 1

    sys.stdout.write("\nEND OF EXPERIMENT\n")

if __name__ == "__main__":
    sys.exit( main(sys.argv) )
