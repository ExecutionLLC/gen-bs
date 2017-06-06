#!/bin/bash
# This script runs web server bundle in production mode.
SCRIPT='index.js'

GEN_WS_LOG_PATH=${GEN_WS_LOG_PATH:-'./logs/webserver.log'} 

mkdir -p ${GEN_WS_LOG_PATH}

npm install

node ${SCRIPT}
