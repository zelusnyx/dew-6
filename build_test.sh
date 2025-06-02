#!/usr/bin/env bash

# change PORTS as per environment
# 4000 - prod
# 6100 - test1
# 6200 - test2
# 6300 - test3
PORT=4000
FRNTBLD="prod"
path=`pwd`
if [[ $path =~ "test1" ]]; then
	PORT=6100
	FRNTBLD="buildt1"
fi

if [[ $path =~ "test2" ]]; then
	PORT=6200
	FRNTBLD="buildt2"
fi

if [[ $path =~ "test3" ]]; then
	PORT=6300
	FRNTBLD="buildt3"
fi

echo "port: $PORT"
echo "FRNTBLD: $FRNTBLD"

echo "Building frontend..."

cd frontend
npm install
`npm run $FRNTBLD`
cd ..

echo "Building documentation..."

cd documentation
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
mkdocs build
cd ..

echo "Building backend..."
cd backend
make deploy PORT=$PORT
cd ..

echo "Reloading nginx..."
sudo service nginx reload
