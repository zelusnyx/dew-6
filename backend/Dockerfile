FROM python:3.8.1-buster

# Install spacy and nlp related tools
RUN pip install spacy==2.2.3
RUN spacy download en

# Install nginx
RUN apt-get update && apt-get -y install nginx

# Install uwsgi
RUN pip install uwsgi

# Configure base directory
WORKDIR /app

COPY requirements.txt /app/requirements.txt
# Install dependencies
RUN pip install -r requirements.txt

COPY . /app

COPY nginx.conf /etc/nginx

# Use settings_production
RUN mv DEWAPI/settings.py DEWAPI/settings_dev.txt && mv DEWAPI/settings_production.py DEWAPI/settings.py

RUN mkdir -p /app/db/

# Given run permissions
RUN chmod a+x startup.sh

# Start server
CMD [ "./startup.sh" ]
