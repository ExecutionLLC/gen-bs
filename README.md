# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

# GIT Workflow

Please see the interactive workflow description here:

https://guides.github.com/introduction/flow/

# Organization

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.

# Installation

Currently, Node v4.2.2 is using. To be able to switch node versions easily in future it is recommended to use Node version manager (NVM), which is downloadable by the link below:

https://github.com/creationix/nvm

After `nvm` is installed and the terminal is relaunched, as `nvm` wants, please type the following:

    nvm install 4.2.2

This will install Node version 4.2.2.

After the proper node version is installed, go to the sources root and execute `npm install` command which will install project dependencies.

Currently, we have two jQuery plugins installed as submodules. To initialize them, from the sources root execute the following commands:

    git submodule init
    git submodule update

Then, use `npm start` to launch the frontend with WS.
