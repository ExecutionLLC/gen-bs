#!/bin/bash

cd /webserver

# Create actual run root and move everything we need into it
mkdir -p .tmp-run
mv * .tmp-run/
cd .tmp-run

# Now we need to pass env vars into built frontend
# Default values for the variables are set inside the Dockerfile during build.
set_env() {
    TARGET_FILE='genomix.js'
    ENV_VAR_NAME=${1}
    # This is the placeholder value inside the file.
    ENV_VAR_STR="##${ENV_VAR_NAME}##"
    ENV_VAR_VALUE=${2}
    echo "=> Setting ${ENV_VAR_NAME} to ${ENV_VAR_VALUE}"
    sed -i.bak s/${ENV_VAR_STR}/${ENV_VAR_VALUE}/g ${TARGET_FILE}
}

FRONTEND_ENV_VARS = `env |grep GEN_FRONTEND`
while read -r ENV_VAR; do
    ENV_VAR_NAME="${ENV_VAR#*@}"
    ENV_VAR_VALUE="${ENV_VAR%*@}"
    set_env ${ENV_VAR_NAME} ${ENV_VAR_VALUE}
done <<< "${FRONTEND_ENV_VARS}"

