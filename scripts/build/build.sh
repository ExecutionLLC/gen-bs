#!/bin/bash
ROOT='../..'
BUILD_DIR="${ROOT}/build"
MERGE_OUT_FILE="${BUILD_DIR}/webserver.opt.js"
MANGLE_OUT_FILE="${BUILD_DIR}/index.js" # The name is also used in the bootstrap.sh
PUBLIC_ASSETS="../../public/"
DATABASE_ASSETS="../../database/"

# Fail on error
set -e

echo "Cleaning up build directory"
rm -rf ${BUILD_DIR} && mkdir -p ${BUILD_DIR}

echo "Make one file from all the WebServer code"
node merge.js --out ${MERGE_OUT_FILE}

echo "Minify and uglify the result."
node ../../node_modules/uglify-js/bin/uglifyjs --compress --mangle -- ${MERGE_OUT_FILE} > ${MANGLE_OUT_FILE}

echo "Removing merge results."
rm ${MERGE_OUT_FILE}

echo "Copying public assets to the build folder."
cp -r ${PUBLIC_ASSETS} ${BUILD_DIR}

echo "Copying database files to the build folder."
cp -r ${DATABASE_ASSETS} ${BUILD_DIR}

echo "Copying package.json from the main project."
cp ${ROOT}/package.json ${BUILD_DIR}

echo "Copying run.sh"
cp run.sh ${BUILD_DIR}/run.sh
chmod u+x ${BUILD_DIR}/run.sh
