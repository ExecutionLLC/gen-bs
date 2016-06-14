#!/bin/bash
# This script runs web server bundle in production mode.
SCRIPT='webserver.js'

npm install

GEN_WS_LOG_PATH=${GEN_WS_LOG_PATH:-'./logs/webserver.log'} node ${SCRIPT}
