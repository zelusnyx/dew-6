#!/usr/bin/env python
import pika
import uuid, os
import subprocess
from  subprocess import call

class RpcClient(object):

    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host="localhost"))

        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue="", exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True)

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body

    def call(self, n):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(
            exchange="",
            routing_key="rpc_queue",
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=str(n))
        while self.response is None:
            self.connection.process_data_events()
        return int(self.response)


test_rpc = RpcClient()

print("Requesting bash command")
l = ["actor0 run0", "actor1 run1", "actor2 run2"]
#x = h.parse_with_labels(l)
#print("hi")
for s in l:
    actor_name = s.split(" ")[0]
    action_name = s.split(" ")[1]
    #print(actor_name)
    #print(action_name)
    var1 = actor_name
    var2 = action_name
    print("actor requesting", var1)
    print("actor requesting", var2)
    subprocess.check_call(["/home/kishu/dew/create_pipeline.sh", var1, var2])
    command = "sh "+ action_name + ".sh"
    ifile = "/home/kishu/dew/"+var2+".sh"
    print(ifile)
    line = open(ifile, "r")
    print("action to be executed is", line.readline())
   # print("command is ", command)
    response = test_rpc.call(command)

    if response == 0:
        print("suucessfully executed command", command)
        print("now need to write the clean up script")
        #subprocess.call("/home/kishu/dew/cleanup.sh")
        os.system("sudo rm /etc/monit/ac*")
        print("returned after clean up")
    else:
        print("didnt execute the command", command)
