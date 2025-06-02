#!/usr/bin/env bash

echo "Logging into github cli using token"
gh auth login --with-token < ~/dew/ram_token.txt

echo "Pulling from github releases...."
COMMIT=`git log -1 --format=%H`
git pull origin
gh release download "release-${COMMIT}"


echo "Extracting frontend..."
tar -xzf frontend.tar.gz

echo "Extracting documentation..."
tar -xzf docs.tar.gz

echo "Loading docker image"
docker load < dew.tar.gz
cd backend
make run PORT=4000

