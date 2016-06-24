#!/bin/bash

set -e
set -x

NODE_VERSION='6.1.0'
# Do not export it otherwise only production deps will be installed
BUILD_NODE_ENV=production
WS_ROOT=/webserver

# Load NVM
source ${HOME}/.profile
nvm install ${NODE_VERSION}

# Install deps and run build in production mode
cd ${WS_ROOT} && npm install && NODE_ENV=${BUILD_NODE_ENV} npm run build
