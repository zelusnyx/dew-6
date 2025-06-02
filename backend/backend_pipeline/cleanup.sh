#bash -c 'head -n -2 /etc/monit/monitrc > /etc/monit/monitrc2'
#bash -c 'rm /etc/monit/monitrc'
#bash -c 'mv /etc/monit/monitrc2 /etc/monit/monitrc'
#bash -c "chmod 0700 /etc/monit/monitrc"
rm /etc/monit/actor*
#bash -c 'sudo monit -t'
#bash -c 'sudo monit reload'

