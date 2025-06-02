#!/usr/bin/env python
import pika, sys, os
import socket, re
import sqlite3
import signal
import collections
import subprocess
import time
import threading

children={}
spawned={}

def recursivekill(pid):
    global children
    
    if pid in children:
        for c in children[pid]:
            recursivekill(c)

    try:
        os.kill(int(pid),signal.SIGABRT)
    except:
        pass
        

    
# build a list of parent/child jobs
def pstree():
    global children
    tomatch = re.compile("^\d+$")
    files=os.listdir("/proc")
    
    children={}
    for f in files:
        if (tomatch.match(f)):
            try:
                with open("/proc/"+f+"/stat") as myfile:
                    lines = myfile.readlines()
                    items = lines[0].split(' ')
                    pid = items[0]
                    cmd = items[1]
                    i = 2
                    if cmd.startswith("("):
                        while not cmd.endswith(")"):
                            cmd = cmd + " " + items[i]
                            i += 1
                    state = items[i]
                    i += 1
                    ppid = items[i]
                    if ppid in children:
                        children[ppid].append(pid)
                    else:
                        children[ppid] = [pid]
            except FileNotFoundError:
                pass


def cb(ch, method, properties, body):
    global connection
    if callback is not None:
        t = threading.Thread(target=callback, args=(ch, method, properties, body))
        t.daemon = True
        t.start()
        
        while t.is_alive():
            print("[INFO] heart beating")
            connection.process_data_events()
            connection.sleep(5)

            #ch.basic_ack(delivery_tag=method.delivery_tag)
            
def callback(ch, method, properties, body):
    global children
    received_data = body.decode()
        
    f = open("/tmp/runjob.log", "a") 
    epoch=time.time()
    timenow=time.strftime("%d %b %Y %H:%M:%S", time.localtime(epoch)) 
    f.write(timenow + " received %r\n" % body.decode())
    print(" [x] Received msg %r" % body.decode())
    f.close()
    
    elems = received_data.split()
    if (len(elems) != 3):
        return
    cmd = elems[0]
    script = elems[1]
    num = elems[2]
    if (cmd != "start" and  cmd != "stop"):
        return

    if cmd == "start":
        childpid = os.fork()
        if childpid == 0:
            print("Starting child /bin/bash ", script)
            process = subprocess.Popen(["/bin/bash",  script])
            f = open("/tmp/runjob.log", "a") 
            epoch=time.time()
            timenow=time.strftime("%d %b %Y %H:%M:%S", time.localtime(epoch)) 
            f.write(timenow + " started child /bin/bash %s\n" % script)
            f.close()
            return
        else:
            con = sqlite3.connect('/tmp/dew.db')
            cur = con.cursor()
            statement = "insert into processes values (" + str(childpid)+",\""+script+"\","+str(num)+")"
            print(statement)
            cur.execute(statement)
            con.commit()
            con.close()#	print "Got child pid $childpid\n";
            print("Finished parent ")
    elif cmd == 'stop':
        pstree()
        con = sqlite3.connect('/tmp/dew.db')
        cur = con.cursor()
        if (script != "all" and num != "all"):
            statement = "select pid from processes where cmd=\""+script+"\" and num="+str(num)
        else:
            statement = "select pid from processes\n"
        print(statement)

        for row in cur.execute(statement):
            pid = str(row[0])
            print("Got pid from DB ", pid)

            if pid in children:
                print("Children has pid ", pid)
                for c in children[pid]:
                    print("Should kill child ", c)
                    recursivekill(c)
            print("Should kill ", pid)
            delpid = pid
            try:
                os.kill(int(pid),signal.SIGABRT)
                del pid
                os.wait()
                #subprocess.call(["kill", "-9", pid])
            except:
                print("Error ", sys.exc_info()[0])
                pass

            statementd = "delete from processes where pid="+delpid
            cud = con.cursor()
            cud.execute(statementd)
        con.commit()
        con.close()#
    return

    
def main():

    global connection

    hostname = socket.gethostname().split('.')
    myname = hostname[0]

    credentials = pika.PlainCredentials('dew', 'dew')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=myname, credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue='experiment')

    channel.basic_consume(queue='experiment', on_message_callback=cb, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
