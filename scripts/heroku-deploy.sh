#!/bin/bash

# Deploying current branch by default
CURRENT_BRANCH_NAME=`git rev-parse --abbrev-ref HEAD`

git push heroku $CURRENT_BRANCH_NAME:master
