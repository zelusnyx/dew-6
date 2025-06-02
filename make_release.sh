#!/usr/bin/env bash

echo "Zipping frontend..."
tar -czf frontend.tar.gz frontend/dist

echo "Zipping documentation..."
tar -czf docs.tar.gz documentation/site

echo "Creating docker image tar file..."
cd backend
rm dew.tar.gz
make image_file
cd ..

echo "Pushing to github releases...."
COMMIT=`git log -1 --format=%H`

gh release create "release-${COMMIT}" 'frontend.tar.gz#frontend' 'docs.tar.gz#docs' 'backend/dew.tar.gz#backend' -p --target "${COMMIT}"


