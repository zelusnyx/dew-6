# TestBed Orchestrator - deprecated - this folder contains software we do not use

Testbed orchestrator folder has 2 main files: nodeExecutor and nodeCommunicator.

final_setup.sh: Bash script which installs the dependencies required for rabbitMQ.

final_setup_all.sh: Bash script which installs dependencies for Monit, create monitrc and other required files.

NodeExecutor.py : This python file starts consuming messages from the queue,
                  extract action out the message then executing the action based on dependent actions.
                  The message is read from queue sequentially and then based on the dependencies of action, the action
                  is executed.

                  NOTE: message format to consider for different types of action
                  # msg format when  no dependency found msg = [action_name, actor_name, emitted_keyword, node]
                  # msg format when dependency found msg = ["when",action_name, actor_name, emitted_keyword, node, dependency]

QueueCommunicator.py : This python file reads the input dew file,
                       parses the statements creates the message in required format
                       and then put the messages to the queue.
                       All the actions are put in the queue and then NodeExecutor executes these actions.

RabbitMqAdmin : this file is just to check if the queue is created, messages are put in the queue or not.

                Commands to check:
                #python3 rabbitmqadmin list queues : to check for all the queues and number of messages in the queue
                #./rabbitmqadmin delete queue name=rpc_queue : to delete any queue

