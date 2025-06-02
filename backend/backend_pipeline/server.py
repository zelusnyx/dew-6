#!/usr/bin/env python
import pika
import os
import subprocess
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host="localhost"))
channel = connection.channel()
channel.queue_declare(queue="rpc_queue")
def run_bash(msg1):
    #msg1 = msg1.encode("utf-8")
    print("inside run bash, ", msg1, type(msg1))
    # hostname = "google.com"  # example
    response = os.system(msg1)

    # and then check the response
   # print("server respomse oode is ", int(response))
    #if int(response) == 0 :
        #subprocess.call("/home/kishu/dew/cleanup.sh")
    return int(response)
    # x = os.system(msg1)
    #print("command ran", msg1)
def on_request(ch, method, props, body):
    msg = body

    # print("running bash" % msg)
    response = run_bash(msg)

    ch.basic_publish(exchange="", \
                     routing_key=props.reply_to, \
                     properties=pika.BasicProperties(correlation_id = \
                                                         props.correlation_id),
                     body=str(response))
    ch.basic_ack(delivery_tag=method.delivery_tag)
channel.basic_qos()
channel.basic_consume(queue="rpc_queue", on_message_callback=on_request)
print(" Awaiting commands to run ")
channel.start_consuming()
