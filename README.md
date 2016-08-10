# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

See general information about the project [here](docs/general-info.md)

# GIT Workflow

Please see the interactive workflow description here:

https://guides.github.com/introduction/flow/

## Branch Naming and Commits

When a new branch is created for an issue, it's name, in addition to the pieces of advice by the link above, must contain the issue number, ex. view-builder-name-fix-123. If the branch is expected to fix several issues at once (which is better to avoid), the issue number can be omitted.

Commits to the branch should contain the number of the issue they are related to, using the following syntax:

`Added check for view name max length (#123)`

This way GitHub will automatically link the commit and issue together.

## Issues

Issues should be labeled by the names of the application parts they are related to, ex. `web-server` or `frontend`. If there are several parts in issue, all labels should be added.

When issue is fixed, and pull request is created for it, it should be marked by `fixed but not checked` label.

Issue should be closed when published on the demo-server or VEP test server.

Issues waiting for some external action (ex. next prototype completion) should be labeled as `pending`.

# Project Structure

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data which is got from the underlying logic.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here. The services should know nothing about the outer world.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.
- utils, where helper methods are placed, such as snake-to-camel case conversion utility.
- startup contains scripts executing at service start, such as database creation, AS data retrieval, etc.
- defaults, where the database seeds are living.

NPM scripts are used to build and launch anything the project needs.

# Installation

## Database Installation

Web server uses PostgreSQL to store project metadata (anything it needs, except the sample and source data itself, which is stored inside the application server). So, to be able to run it, you need to install PostgreSQL somewhere. If database access settings are different from defaults (which can be found in the `utils/Config.js`), use the following environment variables later when running to configure it:

* `GEN_WS_DATABASE_SERVER` - to configure database host name.
* `GEN_WS_DATABASE_PORT` - to configure database port.
* `GEN_WS_DATABASE_USER` - user with root access to the server, defaults to `postgres`.
* `GEN_WS_DATABASE_PASSWORD` - root user password.
* `GEN_WS_DATABASE_NAME` - name of the database to use for the project.
* `GEN_WS_RABBIT_MQ_HOST`, `GEN_WS_RABBIT_MQ_PORT`, `GEN_WS_RABBIT_MQ_USER`, `GEN_WS_RABBIT_MQ_PASSWORD` - RabbitMQ settings. Please bear in mind that default "guest"/"guest" user works only for localhost connections.

## Web Server Launch

Currently, Node v6.1.0 is used. To be able to switch node versions easily in future it is recommended to use Node version manager (NVM), which is downloadable by the link below:

https://github.com/creationix/nvm

After `nvm` is installed and the terminal is relaunched, as `nvm` wants, please type the following:

    nvm install 6.1.0

This will install and use specified version of Node.

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

# Running WebServer Tests

To run tests for WebServer from the terminal, use the following command:

    npm test

To test WebServer from WebStorm:

* Create a new configuration for Mocha
* Set the following environment variables:
    * `GEN_WS_DISABLE_REQUEST_LIMITS=true` - important, as part of the tests will be failing with HTTP error 429 otherwise.
    * `GEN_WS_DATABASE_NAME=yourdatabasenamehere` - optional, if you want to use a different database for testing. Don't forget to create it using `GEN_WS_DATABASE_NAME=yourdatabasehere npm run db:reset`

Currently, there is no way to run only one test, as in this case the before-all-tests hook is not running, so there will be no mocked web server.

# Additional Info

Default database data lays in `defaults/` folder.

Part of the default data is imported from the external JSON files and needs some transformations to be imported. Such data lays in `defaults/templates/` folder.

The scripts generating the actual defaults are also kept at the `defaults/` folder. These scripts can be launched by running the following command:

    npm run defaults:generate
    
This needs to be done every time when the default data is changed. The process changes indices of the default fields, users and data, so you'll finish with a lot of files changes even if you did no changes.
