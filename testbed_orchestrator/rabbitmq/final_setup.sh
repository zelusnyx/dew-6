#!/bin/bash

#This script installs the dependency at the nodes.
#TODO : we can call node executor and node communicator from this script once we have dew file input
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



main ()
{
  default_user=$(logname 2>/dev/null || echo ${SUDO_USER:-${USER}})
HOME="/home/${default_user}"
bash -c 'apt-get update -y'
bash -c 'apt-get install python-pip -y'
bash -c 'apt install python3-pip -u'
bash -c 'pip3 install python3-pika -y'
bash -c 'apt-get install rabbitmq-server -y --fix-missing'
bash -c 'service rabbitmq-server start'

# abort_already_configured

  echo "The repository is setup! You can now install packages."
}


main

