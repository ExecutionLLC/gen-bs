#!/bin/bash

# Frontend
export GEN_FRONTEND_API_HOST=test.genomics-exe.com
export GEN_FRONTEND_API_PORT=443
export GEN_FRONTEND_USE_SECURE_CONNECTION=true

# WebServer
export GEN_WS_PORT=8080
export GEN_WS_DATABASE_SERVER=web-server-postgresql.cklniwip7xtw.us-east-1.rds.amazonaws.com
export GEN_WS_DATABASE_PASSWORD=zxcasdqwe123
export GEN_WS_DATABASE_NAME=genomixtest
export GEN_WS_LOG_PATH=$HOME/logs/web-server.log
export GEN_WS_USER_SESSION_TIMEOUT=900
export GEN_WS_BASE_URL='http://test.genomics-exe.com'
export GEN_WS_REDIS_HOST='demoredis1000.qdlqlw.0001.use1.cache.amazonaws.com'
export GEN_WS_RABBIT_MQ_HOST='ec2-52-91-239-89.compute-1.amazonaws.com'
export GEN_WS_RABBIT_MQ_USER='genomix'
export GEN_WS_RABBIT_MQ_PASSWORD='genomix'
export GEN_WS_RABBIT_MQ_VIRTUAL_HOST='test'
export GEN_WS_S3_NEW_SAMPLES_BUCKET_NAME='execution-genomics-testing-new-sample'

nvm use 6.1.0

# AppServer
export GEN_BACKEND_ACCESS_KEY_ID=AKIAJKA73IEQR3ECGPVA
export GEN_BACKEND_SECRET_ACCESS_KEY=dscCUuN77SzmSMMJ5hYOUQrFrfAFmERQsAY1JTnv
export GEN_BACKEND_REGION=us-east-1
export GEN_BACKEND_BUCKET=executiontestserver
export GEN_BACKEND_RABBITMQ_HOST='ec2-52-91-239-89.compute-1.amazonaws.com'
export GEN_BACKEND_RABBITMQ_VHOST='test'
export GEN_BACKEND_RABBITMQ_USER=genomix
export GEN_BACKEND_RABBITMQ_PASSWORD=genomix
export GEN_BACKEND_LOG_FILE_PREFIX=$HOME/logs/genomics-backend.log
export GEN_BACKEND_VEP_SCRIPT=/home/ubuntu/DemoAppServer/genomics-backend/vep_utils/vep_wrapper.pl
