#!/usr/bin/env python
import pika, sys, os, pwd
import socket, re
import sqlite3
import signal
import collections
import subprocess
import time
import threading
from os.path import exists

    
myscript={}
children={}
spawned={}
started=False
isdone=False
user=""
home=""
starttime=0
folder=""
netname = ""
myname = ""

def init_script(node, script):
    global myscript, started, user, home

    # Find DEW from script and get username and home dir from there
    items = script.split('/')
    home = ""
    prev = None
    for i in items:
        if (i != "DEW"):
            if home.endswith('/'):
                home = home + i
            else:
                home = home + "/" + i
            prev = i
        elif (i == "DEW"):
            user = prev
            break
        
    started=False

    with open(script) as myfile:
        lines = myfile.readlines()
        myfile.close()

    cid=0
    for l in lines:
        l = l.strip()
        items = l.split(' ')
        for id in range(0, len(items), 2):
            if items[id] == "cmd":
                cid=items[id+1]
                myscript[cid] = {}
                myscript[cid]['done'] = False
                myscript[cid]['when'] = []
                myscript[cid]['tell'] = {}
                myscript[cid]['wait'] = 0
                myscript[cid]['actor'] = ""
                myscript[cid]['action'] = ""
                continue
            if items[id] == "when" and items[id+1] != "none":                
                cond=items[id+1]
                myscript[cid]['when'].append(items[id+1])
                continue
            if items[id] == "wait" and items[id+1] != "none":
                myscript[cid]['wait'] = items[id+1]
                continue
            if items[id] == "actor":
                myscript[cid]['actor'] = items[id+1]
                continue
            if items[id] == "action":
                myscript[cid]['action'] = items[id+1]
                continue
        for cond in myscript[cid]['when']:
            elems = cond.split('-')
            if elems[1] not in myscript.keys():
                myscript[elems[1]] = {}
                myscript[elems[1]]['tell'] = {}
            myscript[elems[1]]['tell'][myscript[cid]['actor']] = elems[0]
    todelete=[]
    for cid, val in myscript.items():
        if  myscript[cid]['actor'] != node:
            todelete.append(cid)
    for cid in todelete:
        print("Will delete command ", cid, " actor ", myscript[cid]['actor'], " node ", node)
        sys.stdout.flush()
        del myscript[cid]
    for cid, val in myscript.items():    
        print("Command ", cid, " when ")
        sys.stdout.flush()
        for cond in myscript[cid]['when']:
            print(cond)
            sys.stdout.flush()
        print(" actor ", myscript[cid]['actor'], " action ", myscript[cid]['action'], " tell ")
        sys.stdout.flush()
        for rec, mess in myscript[cid]['tell'].items():
            print(rec, mess)
            sys.stdout.flush()
        print("\n\n")
        sys.stdout.flush()

    

        
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

def run_cmd(script, num):
    global user
    print("Starting /bin/bash ", script)
    sys.stdout.flush()
    f = open("/tmp/runjob.log", "a") 
    epoch=time.time()
    timenow=time.strftime("%d %b %Y %H:%M:%S", time.localtime(epoch)) 
    f.write(timenow + " started child /bin/bash %s\n" % script)
    f.close()
    # Run as user
    pw_record = pwd.getpwnam(user)
    user_name      = pw_record.pw_name
    user_home_dir  = pw_record.pw_dir
    user_uid       = pw_record.pw_uid
    user_gid       = pw_record.pw_gid
    env = os.environ.copy()
    env[ 'HOME'     ]  = user_home_dir
    env[ 'LOGNAME'  ]  = user_name
    env[ 'PWD'      ]  = user_home_dir
    env[ 'USER'     ]  = user_name
    print("Will run script ", script)
    sys.stdout.flush()
    process = subprocess.Popen(["sudo", "-u",user_name, "/bin/bash", script], start_new_session=True, env=env, cwd=user_home_dir, stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
    #process = subprocess.Popen(["/bin/bash", script], stderr=subprocess.STDOUT, stdout=subprocess.PIPE)
    print("Opened process, pid ", process.pid, " as user ", user_uid, " in group ", user_gid, " home dir ", user_home_dir)
    sys.stdout.flush()
    f = open("/tmp/runjob.log", "a") 
    epoch=time.time()
    timenow=time.strftime("%d %b %Y %H:%M:%S", time.localtime(epoch)) 
    f.write(timenow + " started child /bin/bash %s\n" % script)
    f.flush()
    f.close()
    con = sqlite3.connect('/tmp/dew.db')
    cur = con.cursor()
    statement = "insert into processes values (" + str(process.pid)+",\""+script+"\","+str(num)+")"
    print(statement)
    sys.stdout.flush()
    cur.execute(statement)
    con.commit()
    con.close()
    sys.stdout.flush()
    return
            
def cb(ch, method, properties, body):
    global connection
    if callback is not None:
        t = threading.Thread(target=callback, args=(ch, method, properties, body))
        t.daemon = True
        t.start()
        
def callback(ch, method, properties, body):
    global children
    global starttime
    global folder
    global myscript
    
    received_data = body.decode()
        
    f = open("/tmp/schedulejob.log", "a") 
    epoch=time.time()
    timenow=time.strftime("%d %b %Y %H:%M:%S", time.localtime(epoch)) 
    f.write(timenow + " received %r\n" % body.decode())
    f.flush()
    print(" [x] Received msg %r" % body.decode())
    sys.stdout.flush()
    f.close()
    
    elems = received_data.split()
    
    cmd = elems[0]
    if (cmd == "init"):
        if (len(elems) != 3):
            return

        init_script(elems[1], elems[2])
        return

    if (cmd == "start"):
        if (len(elems) != 3):
            return
        starttime = int(elems[1])
        folder = elems[2]
        
        return

    if (cmd.startswith("psuccess") or cmd.startswith("pexists")):
            for cid, val in myscript.items():    
                if cmd in myscript[cid]['when']:
                    myscript[cid]['when'].remove(cmd)
                    print("Removed ", cmd, " from command ", cid)
                    sys.stdout.flush()
            return
        

    if cmd == 'stop':
        if (len(elems) != 3):
            return
        script = elems[1]
        num = elems[2]
        pstree()
        con = sqlite3.connect('/tmp/dew.db')
        cur = con.cursor()
        if (script != "all" and num != "all"):
            statement = "select pid from processes where cmd=\""+script+"\" and num="+str(num)
        else:
            statement = "select pid from processes\n"
        print(statement)
        sys.stdout.flush()

        for row in cur.execute(statement):
            pid = str(row[0])
            print("Got pid from DB ", pid)
            sys.stdout.flush()
        
            if pid in children:
                print("Children has pid ", pid)
                sys.stdout.flush()
                for c in children[pid]:
                    print("Should kill child ", c)
                    sys.stdout.flush()
                    recursivekill(c)
            print("Should kill ", pid)
            sys.stdout.flush()
            delpid = pid
            try:
                os.kill(int(pid),signal.SIGABRT)
                del pid
                os.wait()
                #subprocess.call(["kill", "-9", pid])
            except:
                print("Error ", sys.exc_info()[0])
                sys.stdout.flush()
                pass

            statementd = "delete from processes where pid="+delpid
            cud = con.cursor()
            cud.execute(statementd)
        con.commit()
        con.close()#
    return

def check_events():
    global myscript
    global started, isdone
    global starttime
    global folder

    while True:

        if starttime != 0:
            if time.time() >= starttime:
                started = True
                starttime = 0
                print("Starting now, time ", time.time())
                sys.stdout.flush()
        if started == False:
            continue

        donecids=[]
        for cid, val in myscript.items():
            todelete=[]
            if len(myscript[cid]['when']) == 0 and myscript[cid]['done'] == False:
                cmd= folder + "/" + myscript[cid]['action']
                t = threading.Thread(target=run_cmd, args=(cmd, cid))
                t.daemon = True
                t.start()
                myscript[cid]['done'] = True
                    
            for rec, mess in myscript[cid]['tell'].items():
                if (mess == "psuccess" or mess == "pexists"): #Jelena do something for pexists
                    if (mess == "psuccess"):
                        filename = folder + "/status." + str(cid)
                    else:
                        filename = folder + "/pid." + str(cid)
                    file_exists = exists(filename)
                    if (file_exists):
                        with open(filename) as myfile:
                            lines = myfile.readlines()
                            myfile.close()
                            for l in lines:
                                if (int(l) == 0 and mess == "psuccess") or mess == "pexists":
                                    print("Will tell " + mess + "-" + str(cid) + " to " + rec)
                                    sys.stdout.flush()
                                    inform(mess + "-" +str(cid), rec)
                                    todelete.append(rec)
                                    continue
                print("Command ", cid, " waiting to tell ", rec, " about ", mess)
                sys.stdout.flush()

            for rec in todelete:
                del(myscript[cid]['tell'][rec])

        isdone = True
        for cid, val in myscript.items():
            if not myscript[cid]['done']:
                isdone = False
            
        # Delete commands that are done            
        time.sleep(0.1)

def inform(msg, host):

    global netname
    
    host = host + '.' + netname
    credentials = pika.PlainCredentials('dew', 'dew')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host, credentials=credentials))
    channel = connection.channel()


    try:
        channel.basic_publish(exchange='',
                              routing_key='experiment',
                              body=msg, properties=pika.BasicProperties(content_type='text/plain',
                                                          delivery_mode=pika.DeliveryMode.Transient),
                          mandatory=True)
        
        print(" [x] Sent ", msg, " to ", host)
        sys.stdout.flush()
    except pika.exceptions.UnroutableError:
        print(" [x] Message ", msg, " was returned")
        sys.stdout.flush()
                
    connection.close()

        
def main():

    global connection
    global netname
    global myname
    
    hostname = socket.gethostname().split('.')
    for h in hostname:
        if myname == "":
            myname = h
        elif netname == "":
            netname = h
        else:
            netname = netname+'.'+h

    t = threading.Thread(target=check_events, args=())
    t.daemon = True
    t.start()
        
    credentials = pika.PlainCredentials('dew', 'dew')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=socket.gethostname(), credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue='experiment', exclusive=False, auto_delete=False)
    
    channel.basic_consume(queue='experiment', on_message_callback=cb, auto_ack=True)
    channel.confirm_delivery()

    print(' [*] Waiting for messages. To exit press CTRL+C')
    sys.stdout.flush()
                    
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
