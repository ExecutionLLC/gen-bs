# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

See general information about the project [here](docs/general-info.md)

# GIT Workflow

Please see the interactive workflow description here:

https://guides.github.com/introduction/flow/

# Project Structure

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data which is got from the underlying logic.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here. The services should know nothing about the outer world.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.
- utils, where helper methods are placed, such as snake-to-camel case conversion utility.
- startup contains scripts executing at service start, such as database creation, AS data retrieval, etc.

NPM scripts are used to build and launch anything the project needs.

# Installation

## Database Installation

Web server uses PostgreSQL to store project metadata (anything it needs, except the sample and source data itself, which is stored inside the application server). So, to be able to run it, you need to install PostgreSQL somewhere. If database access settings are different from defaults (which can be found in the `utils/Config.js`), use the following environment variables later when running to configure it:

* `GEN_WS_DATABASE_SERVER` - to configure database host name.
* `GEN_WS_DATABASE_PORT` - to configure database port.
* `GEN_WS_DATABASE_USER` - user with root access to the server, defaults to `postgres`.
* `GEN_WS_DATABASE_PASSWORD` - root user password.
* `GEN_WS_DATABASE_NAME` - name of the database to use for the project.

## Web Server Launch

Currently, Node v4.2.2 is used. To be able to switch node versions easily in future it is recommended to use Node version manager (NVM), which is downloadable by the link below:

https://github.com/creationix/nvm

After `nvm` is installed and the terminal is relaunched, as `nvm` wants, please type the following:

    nvm install 4.2.2

This will install Node version 4.2.2.

After the proper node version is installed, go to the sources root and execute:

    npm install

This command will install all the project dependencies.

Currently, we have two jQuery plugins installed as submodules. To initialize them, from the sources root execute the following commands:

    git submodule init
    git submodule update

Now the database should be created for the project. Use the following command to do that:

    npm run db:create

After the database is created, it should be filled with default values, such as samples and views. To do that, execute the following command:

    npm run defaults:import

After all of that done without errors, use the following command to launch the frontend with WS:

    npm start

# Additional Info

Default database data lays in `defaults/` folder.

Part of the default data is imported from the external JSON files and needs some transformations to be imported. Such data lays in `defaults/templates/` folder.

The scripts generating the actual defaults are also kept at the `defaults/` folder. These scripts can be launched by running the following command:

    npm run defaults:generate
    
This needs to be done every time when the default data is changed. The process changes indices of the default fields, users and data, so you'll finish with a lot of files changes even if you did no changes.
