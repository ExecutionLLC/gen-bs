#!/bin/bash

set -e
set -x

WS_ROOT=/webserver
FRONTEND_JS_FILE=genomics.js
FRONTEND_JS_TEMPLATE=${FRONTEND_JS_FILE}.template
WS_SCRIPT_PATH=${WS_ROOT}/webserver.js


echo "Log file path: ${GEN_WS_LOG_PATH}"
echo "Samples upload path: ${GEN_WS_UPLOAD_PATH}"
echo "Saved files upload path: ${GEN_WS_SAVED_FILES_PATH}"

LOG_DIR=$(dirname ${GEN_WS_LOG_PATH})
mkdir -p ${LOG_DIR} ${GEN_WS_UPLOAD_PATH} ${GEN_WS_SAVED_FILES_PATH}

# Load NVM
source ${HOME}/.profile

# Now we need to pass env vars into built frontend using string replace.
# Default values for the variables are set inside the Dockerfile during build.
FRONTEND_ENV_VARS=$(env | grep GEN_FRONTEND)
SED_REGEX=''

while read -r ENV_VAR; do
    ENV_VAR_NAME="$(echo ${ENV_VAR} | cut -d '=' -f 1)"
    ENV_VAR_VALUE="$(echo ${ENV_VAR} | cut -d '=' -f 2)"

    ENV_VAR_TEMPLATE="##${ENV_VAR_NAME}##"
    ENV_VAR_REGEX="s/${ENV_VAR_TEMPLATE}/${ENV_VAR_VALUE}/g"

    SED_REGEX="${SED_REGEX};${ENV_VAR_REGEX}"
done <<< "${FRONTEND_ENV_VARS}"

# Build actual JS file.
cat ${WS_ROOT}/public/${FRONTEND_JS_TEMPLATE} | sed "${SED_REGEX}" > ${WS_ROOT}/public/${FRONTEND_JS_FILE}

node ${WS_SCRIPT_PATH}
