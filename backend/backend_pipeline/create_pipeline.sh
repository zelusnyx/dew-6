#!/bin/bash
#echo "hi in create pipeline bash file"
VAR1=$1
VAR2=$2
echo $VAR1
echo $VAR2
#it should contain the action
VAR1_NAME="${VAR1}.py"
VAR2_NAME="${VAR2}.sh"
#it will be the file created to monitor by monitrc
VAR1_NAME_SH="${VAR1}_rc"
destdir=/etc/monit/$VAR1_NAME_SH
failure_file=$destdir"/failure.sh"

#echo $failure_file
default_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
HOME="/home/${default_user}"
destdir=$HOME/dew/
monit_text='check program '${VAR2}' with path "/usr/bin/python3 '${destdir}''${VAR2_NAME}'"  with timeout 50 seconds  \
if status = 3 then exec  "/usr/bin/python3 '${failure_file}'"  \';

destdir=/etc/monit/$VAR1_NAME_SH
bash -c "touch '${destdir}'"
#echo $monit_text
if [ -f "$destdir" ]
then
    echo "$monit_text" > "$destdir"
fi

bash -c "chmod 0700 '${destdir}'"

bash -c "monit reload"
monitrc=/etc/monit/monitrc
#echo "include /etc/monit/${VAR1_NAME_SH}">>$monitrc

