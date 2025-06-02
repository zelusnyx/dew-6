#!/bin/bash
curl_check ()
{
  echo "Checking for curl..."
  if command -v curl > /dev/null; then
    echo "Detected curl..."
  else
    echo "curl could not be found, please install curl and try again"
    exit 1
  fi
}


virtualenv_check ()
{
  if [ -z "$VIRTUAL_ENV" ]; then
    echo "Detected VirtualEnv: Please visit https://packagecloud.io/rabbitmq/erlang/install#virtualenv"
  fi
}

new_global_section ()
{
  echo "No pip.conf found, creating"
  mkdir -p "$HOME/.pip"
  pip_extra_url > $HOME/.pip/pip.conf
}

edit_global_section ()
{
  echo "pip.conf found, making a backup copy, and appending"
  cp $HOME/.pip/pip.conf $HOME/.pip/pip.conf.bak
  awk -v regex="$(escaped_pip_extra_url)" '{ gsub(/^\[global\]$/, regex); print }'
  $HOME/.pip/pip.conf.bak > $HOME/.pip/pip.conf
  echo "pip.conf appended, backup copy: $HOME/.pip/pip.conf.bak"
}

pip_check ()
{
  version=`pip --version`
  echo $version
}

abort_already_configured ()
{
  if [ -e "$HOME/.pip/pip.conf" ]; then
    if grep -q "rabbitmq/erlang" "$HOME/.pip/pip.conf"; then
      echo "Already configured pip for this repository, skipping"
      exit 0
    fi
  fi
}

pip_extra_url ()
{
  printf "[global]\nextra-index-url=https://packagecloud.io/rabbitmq/erlang/pypi/simple\n"
}

escaped_pip_extra_url ()
{
  printf "[global]\\\nextra-index-url=https://packagecloud.io/rabbitmq/erlang/pypi/simple"
}

edit_pip_config ()
{
  if [ -e "$HOME/.pip/pip.conf" ]; then
    edit_global_section
  else
    new_global_section
  fi
}

make_server_file()
{
default_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
HOME="/home/${default_user}"
destdir=$HOME/dew/
bash -c "mkdir -p $destdir"
echo "directory created"

if [ ! -e /$destdir/file.txt ]; then

    bash -c "touch $destdir/server.py"
fi
fileDirectory=$destdir/server.py
var='#!/usr/bin/env python
import pika
import os
import subprocess
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host="localhost"))
channel = connection.channel()
channel.queue_declare(queue="rpc_queue")
def run_bash(msg1):
    msg1 = msg1.encode("utf-8")
    print("inside run bash, ", msg1, type(msg1))
    # hostname = "google.com"  # example
    response = os.system(msg1)

    # and then check the response
    # print("server respomse oode is ", int(response.returncode))
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
channel.start_consuming()';

if [ -f "$fileDirectory" ]
then
    echo "$var" > "$fileDirectory"
fi



}

make_client_file()
{
default_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
HOME="/home/${default_user}"
destdir=$HOME/dew
bash -c "mkdir -p $destdir"
echo "directory created"

if [ ! -e /$destdir/file.txt ]; then

    bash -c "touch $destdir/client.py"
fi
fileDirectory=$destdir/client.py
var='#!/usr/bin/env python
import pika
import uuid
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
l = ["actor0 run0", "actor1 run1"]
#x = h.parse_with_labels(l)
print("hi")
for s in l:
    actor_name = s.split(" ")[0]
    action_name = s.split(" ")[1]
    print(actor_name)
    print(action_name)
    var1 = actor_name
    var2 = action_name
    subprocess.check_call("sh create_pipeline.sh  %s %s" % (str(var1), str(var2)), shell=True)
    command = "sh "+ action_name + ".sh"
    response = test_rpc.call(command)

    if response == 0:
        continue
    else:
        print("didnt execute the command", command)';

if [ -f "$fileDirectory" ]
then
    echo "$var" > "$fileDirectory"
fi
}


main ()
{
   default_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
HOME="/home/${default_user}"
cd "$(dirname "$0")"
bash -c 'apt-get update -y'
bash -c 'apt-get install python-pip -y'
bash -c 'apt install python3-pip -u'
bash -c 'pip3 install python3-pika -y'
bash -c 'apt-get install rabbitmq-server -y --fix-missing'
bash -c 'apt install monit -y'
bash -c 'service rabbitmq-server start'
bash -c 'monit reload'

bash -c 'cat /dev/null > /etc/monit/monitrc'
  make_server_file
  make_client_file
  #abort_already_configured
  #curl_check
  #virtualenv_check
  #edit_pip_config
HOME2="/home/${default_user}"
destdir2=$HOME/dew/
var='set daemon 10 \
set httpd port 2812 and \
use address localhost  # only accept connection from localhost \
allow localhost        # allow localhost to connect to the server and \
allow admin:monit      # require user "admin" with password "monit" \
allow @monit           # allow users of group "monit" to connect (rw) \
allow @users readonly  # allow users of group "users" to connect readonly \
check program client with path "/usr/bin/python3 '${destdir2}'client.py"  with timeout 50 seconds  \
if status = 0 then exec  "/usr/bin/python3 '${destdir2}'failure.sh"  \';
destdir=/etc/monit/monitrc

if [ -f "$destdir" ]
then
    echo "$var" > "$destdir"
fi


bash -c "chmod 0700 /etc/monit/monitrc"

bash -c "monit reload"
# abort_already_configured

  echo "The repository is setup! You can now install packages."
}


main

