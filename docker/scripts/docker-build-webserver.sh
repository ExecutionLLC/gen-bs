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

# To allow frontend configuration, we need to be able to provide environment variables
# into the ready-to-launch minified frontend code. To do so, we will replace
# them with template values. The actual values will be substituted during the launch
# of the container.

# Extract environment variables from the frontend config
FRONTEND_ENV_LIST=$(grep -oh 'GEN_FRONTEND_[a-zA-Z0-9_]*' ${WS_ROOT}/frontend/webpack.config.js)

# For each var create and export stub value
while read -r VAR_NAME; do
    VAR_VALUE="##${VAR_NAME}##"
    echo "${VAR_NAME}=${VAR_VALUE}"
    export ${VAR_NAME}="${VAR_VALUE}"
done <<< "${FRONTEND_ENV_LIST}"

# Install deps and run build in production mode
cd ${WS_ROOT}/frontend && npm install 
cd ${WS_ROOT} && npm install && NODE_ENV=${BUILD_NODE_ENV} npm run build

# Install production deps
cd ${WS_ROOT}/build && NODE_ENV=${BUILD_NODE_ENV} npm install

# At this point production build lays in ${WS_ROOT}/build and is ready to launch
