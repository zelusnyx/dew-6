#!/usr/bin/env bash
alembic upgrade head
service nginx start
# python ./run.py
uwsgi --http :8800 -w wsgi:app
# uwsgi --ini uwsgi.ini
