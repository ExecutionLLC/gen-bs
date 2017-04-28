#!/usr/bin/env bash

# This script is used to run the WebServer.

# Stop on error
set -e
npm install
npm run db:ensure
npm run db:reset

npm start