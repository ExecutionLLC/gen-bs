#!/bin/bash
# Script is used to configure Amazon instance

PS1='$ '

echo "\n=> Install Node Version Manager..."
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.30.1/install.sh | bash

echo "\n=> Reload env..."
source ~/.bashrc

echo "\n=> Install Node 4.2.2..."
nvm install 4.2.2
nvm use 4.2.2

echo "\n=> Install dependencies"
npm install

echo "\n=> Launch WebServer!"
npm start
