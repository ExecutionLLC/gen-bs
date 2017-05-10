#!/usr/bin/env bash

# This script is used to run the WebServer.

# Stop on error
set -e
npm run db:prepare

npm start