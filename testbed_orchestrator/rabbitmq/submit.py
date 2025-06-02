#!/usr/bin/env python
import pika, socket, sys, os

def declare():
    min = ''
    with open ("/etc/hosts", "r") as myfile:
        data=myfile.readlines()
        for d in data:
            items = d.split()
            if (len(items) >= 4 and not items[3].startswith('localhost')):
                if (items[3] < min or min == ''):
                    min = items[3]
    return min

def main():
    #min = declare()
    host = sys.argv[1]
    msg = sys.argv[2]

    credentials = pika.PlainCredentials('dew', 'dew')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host, credentials=credentials))
    channel = connection.channel()


    channel.basic_publish(exchange='',
                          routing_key='experiment',
                          body=msg)
    print(" [x] Sent ", msg)

    connection.close()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
