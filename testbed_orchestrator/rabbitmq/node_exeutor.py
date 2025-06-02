#!/usr/bin/env python
import pika
import os

'''
Note : This file executes the actions sent by nodes. The script is always running and keeps reading messages from declared queue
and performs the action. 
If the action to be executed is dependent on previous action then current action will wait unless the dependent action is executed. 
'''

#declare the queue
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host="localhost"))
channel = connection.channel()
#name the queue
channel.queue_declare(queue="rpc_queue")
#list to store the executed commands , i.e result_queue
rq = []
def run_bash(msg):
    '''
    method which executed the given command
    :param msg: action to be executed in string format
    :return: response code if the execution was successful or not
    '''
    msg = msg[1:-2]
    res = os.system(msg)
    print("SERVER response is :", res)
    return  res

def on_request(ch, method, props, body):
    '''
    This function is a callback function when the message is consumed from the queue
    :param ch: channel object
    :param method: how the message needs to be read
    :param props: properties of the connection
    :param body: the message body
    :return: nothing, it only reads the message and executes the command
    '''
    body = body.decode("utf-8")
    '''
    NOTE: message format to consider for different types of action
    #msg format when  no dependecy found msg = [action_name, actor_name, emitted_keyword, node]
    #msg format when dependency found msg = ["when",action_name, actor_name, emitted_keyword, node, dependency]
    '''
    A = list(map(str, body.strip('[]').split(' ')))
    msg_to_put_rq = ""
    #check if the action has any dependency with "when keyword"
    if A[0].find('when') == -1:
        action_to_be_executed = A[0].replace("*", " ")
        response = run_bash(action_to_be_executed)
        if (response == 0):
            msg_to_put_rq = A[2][1:-2]
            print("SERVER: msg put in queue is", msg_to_put_rq)

        else:
            msg_to_put_rq = A[2][1:-2] + "not_executed"
    #when there a dependent action to be executed
    else:
        action_to_be_executed = A[1].replace("*", " ")
        #check for the dependent action
        if body.find(A[5][1:-2]) != -1:
            print("found the dependency ", A[5][1:-1], ", in queue")
            #check if the dependent action is already executed
            '''
            TODO: if the action is yet to be executed, add a wait statement here so that
            the current action can be executed
            '''
            if A[5][1:-1] in rq:
                response = run_bash(action_to_be_executed)
                if (response == 0):
                    msg_to_put_rq = A[3][1:-2]
                    print("SERVER: msg put in queue is", msg_to_put_rq)
            else:
                '''
                TODO: add a wait statement here
                '''
                print("cant execute yet as dependency not executed")
        else:
            msg_to_put_rq = A[3][1:-2] + "not_executed"
    #add the actions executed to the queue
    rq.append(msg_to_put_rq)
#start consuming from queue
channel.basic_consume(queue="rpc_queue", on_message_callback=on_request)
print("SERVER: Awaiting commands to run ")
channel.start_consuming()
