#!/usr/bin/env python
'''
This file parses the dew file and adds the action to the queue(after declaring a queue).
All the actions are added to the queue in a specific format.
'''

import pika

#create the queue
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host="localhost"))
channel = connection.channel()
channel.queue_declare(queue="rpc_queue")

'''
Note: here dew file should be parsed and the message to be sent to nodeExecutor should be in the following format
    #msg format when  no dependecy found msg = [action_name, actor_name, emitted_keyword, node]
    #msg format when dependency found msg = ["when",action_name, actor_name, emitted_keyword, node, dependency]
    Currently I have hard coded it, but the msg should be in the above format format after using HLB parser. 
'''
l = ["A touch nodeA.txt emit pdone4" ,"B when pdone1 touch nodeB.txt emit pdone2 ", "C when pdone2 touch nodea2.txt emit pdone3"]

'''
Now we are going to create the message in the mentioned format
'''
for s in l:
    node = s.split(" ")[0]
    #check if the action has dependency
    if (s.find("when") != -1):
        '''
        the following code is just string manipulation
        '''
        actor_name = s.split(" ")[3]+node
        #right now I have used "*" as a splitter, which is not needed when parsing actual dew file
        action_name = s.split(" ")[3]+"*"+s.split(" ")[4]
        emitted_keyword = s.split(" ")[6]
        dependency = s.split(" ")[2]
        #create the message
        msg = ["when", action_name, actor_name, emitted_keyword, node, dependency]
    #if the action has no dependency
    else:
        actor_name = s.split(" ")[1]+node
        action_name = s.split(" ")[1]+"*" +s.split(" ")[2]
        emitted_keyword = s.split(" ")[4]
        msg = [action_name, actor_name, emitted_keyword, node]

    print("CLIENT : sending message to node executor", msg)
    print("CLIENT: msg added to queue ")
    channel.basic_publish(exchange = '',body= str(msg),routing_key="rpc_queue")
print("CLIENT : Client sent everything to queue ")
connection.close()


