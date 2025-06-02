#!/usr/bin/env python

import sys
import os

from configure import LINUXKERNELPATH, remoteExec, defcomnodes

if not "users" == os.environ['HOST'].split('.',1)[0]:
    sys.exit("The script should run on users\n")


def remoteExec(node, cmd):
    NET = ".jdemo.T1T2.isi.deterlab.net"
    SSH  = "ssh -2 -o stricthostkeychecking=no"
    cmd = SSH + " " + node + NET + " \" " + cmd + " \""
    sys.stdout.write("   RUN: %s\n\n" % cmd)
    if os.system(cmd):
        sys.stderr.write("Command failed\n\n")


def main(argv):
    LINUXKERNELPATH = "/proj/T1T2/linux-2.6.12-1.deter"
    agnode = 'RA1'
    thinnernode = 'RA'
    defcomnodes = []
    defcomnodes.append(agnode)
    defcomnodes.append(thinnernode)

    for node in defcomnodes: 
        cmd  = "sudo ln -sf " + LINUXKERNELPATH + " /lib/modules/\`uname -r\`/build"
        remoteExec(node, cmd)
        cmd  = "sudo ln -sf " + LINUXKERNELPATH + " /lib/modules/\`uname -r\`/source"
        remoteExec(node, cmd)

    for node in defcomnodes:
        sys.stdout.write("Install DefCOM Devices on %s\n" % node)
        remoteExec(node, "sudo mknod /dev/stamp c 150 0")
        remoteExec(node, "sudo mknod /dev/defcomc c 151 0")

if __name__ == "__main__":
