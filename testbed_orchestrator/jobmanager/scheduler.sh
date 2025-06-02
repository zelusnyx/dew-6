#!/bin/bash

case "$1" in
  start)
      echo "Starting scheduler "
      python3 /share/shared/dew/scheduler.py 2>&1 >/tmp/scheduler.out &
      pid=$!
      echo $pid > /tmp/scheduler.pid
      ;;
  stop)
      echo "Stopping scheduler "
      pid=`cat /tmp/scheduler.pid`
      kill -9 $pid
      ;;
  *)
      echo "Usage: scheduler.sh {start|stop}"
      exit 1
esac
    
    
