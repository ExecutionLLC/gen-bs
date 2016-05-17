#!/bin/bash

set -e
# Go to the WS root
cd ../

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
PM_APP_NAME='WebServer'
CURRENT_DATE=$(date +%Y-%m-%dT%H-%M-%S)
TAG_NAME="update-${CURRENT_DATE}"

echo "=> Getting git updates for branch ${CURRENT_BRANCH}"
git pull
echo "=> Checking deps updates in WS"
npm install > /dev/null

echo "=> Checking deps updates in frontend"
cd frontend/
npm install > /dev/null
echo "=> Building frontend"
npm run build > /dev/null

echo "=> Current WebServer status:"
pm2 list ${PM_APP_NAME}
echo "=> Restarting WebServer"
pm2 restart ${PM_APP_NAME} > /dev/null
echo "=> Resetting restart count"
pm2 reset ${PM_APP_NAME}

echo "=> Creating tag ${TAG_NAME}"
git tag ${TAG_NAME}
