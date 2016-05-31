#!/bin/bash

# Frontend Config
export GEN_FRONTEND_API_HOST='139.196.173.157'
export GEN_FRONTEND_API_PORT=8080
export GEN_FRONTEND_SECURE_CONNECTION='false'

# WebServer Config
export GEN_WS_PORT=8080
export GEN_WS_DATABASE_NAME='genomixali'
export GEN_WS_DATABASE_SERVER='rm-2zeuv3j4l00tv1e49.pg.rds.aliyuncs.com'
export GEN_WS_DATABASE_PORT=3433
export GEN_WS_DATABASE_USER='genomixuser'
export GEN_WS_DATABASE_PASSWORD='zxcasdqwe123'
export GEN_WS_LOG_PATH="${HOME}/logs/web-server.log"
export GEN_WS_BASE_URL='http://139.196.173.157:8080'
export GEN_WS_USER_SESSION_TIMEOUT=900

nvm use 4.4.5

