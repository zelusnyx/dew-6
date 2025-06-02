#!/bin/bash

case "$1" in
  start)
      echo "Starting runjob "
      python3 /share/shared/dew/runjob.py 2>&1 >/tmp/runjob.out &
      pid=$!
      echo $pid > /tmp/runjob.pid
      ;;
  stop)
      echo "Stopping runjob "
      pid=`cat /tmp/runjob.pid`
      kill -9 $pid
      ;;
  *)
      echo "Usage: runjob.sh {start|stop}"
      exit 1
esac
    
    
