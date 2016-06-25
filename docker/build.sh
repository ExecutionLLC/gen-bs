#!/bin/bash
BUILD_CONTAINER_NAME=webserver-build
PROD_CONTAINER_NAME=webserver-production

set -e
set -x

# Build container for building
sudo docker build --force-rm -t ${BUILD_CONTAINER_NAME} -f Dockerfile-build ${PWD}

# Create container from the built image
BUILD_CONTAINER_ID=`sudo docker create ${BUILD_CONTAINER_NAME}`

# Extracting build results into local folder
BUILD_DIR=./build
sudo docker cp ${BUILD_CONTAINER_ID}:/webserver/build ${BUILD_DIR}

# Remove temp container
sudo docker rm ${BUILD_CONTAINER_ID}

# Build production container
sudo docker build --force-rm -t ${PROD_CONTAINER_NAME} -f Dockerfile-run ${PWD}

