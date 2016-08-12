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

Web server uses the following external services: 

* RabbitMQ for communication with the Application Server
* Redis as a user session storage
* Postgres as a database server
* Amazon S3 to store exported files (or co-called saved files) and upload samples to the Application Server.

Use environment variables to configure access to these services. The names of the variables along with their defaults can be found in the `utils/Config.js` file.

## Dependencies

Currently, Node v6.1.0 is used. To be able to switch node versions easily in future it is recommended to use Node version manager (NVM), which is downloadable by the link below:

https://github.com/creationix/nvm

After `nvm` is installed and the terminal is relaunched, as `nvm` wants, please type the following:

    nvm install 6.1.0

This will install and use specified version of Node.

After the proper node version is installed, go to the sources root and execute:

    npm install

This command will install all the project dependencies.

We use KnexJS console tool to do database migrations. Execute this command to install the tool:

    npm install -g knex

Currently, we have two jQuery plugins installed as submodules. To initialize them, from the sources root execute:

    git submodule init
    git submodule update

## Database

Be sure to configure access to your Postgres server using the env vars before this section.

Now the database should be created for the project. Use the following command to create an initial database:

    npm run db:create

Now, it should be filled with default values, such as samples and views. To do that, run:

    npm run defaults:import

We also need to apply all database migrations:

    npm run db:migrate
    
### Full Database Reset
    
To do a full database reset you can use the following command:

    npm run db:reset

This command will drop and re-create the database and fill it with default values. **Use with caution**, as you will loose your current database. Use `npm run db:migrate` if you want to update database in production.

### Creating Database Migrations

The database in production is updated using KnexJS migrations which are JS scripts. All migrations are executed in one transaction, so nothing will happen if one of them fails. Migrations are executed in order determined by the creation date fixed in their names.

Knex takes it's settings from the `./database/knexconfig.js` file. The settings there, in turn, are loaded from the main WebServer config.

Migrations are stored in `./database/migrations` folder. To create a new migration, go to the `./database` folder and issue the following command:

    knex migrate:make <name of your migration here>

In a newly created file, the `up()` function is required. This function will move the database to the next version from the previous one. The `down()` function is usually hard to implement and therefore is considered an optional.

For convenience, try to avoid creating large migration scripts. You can split the script into multiple files and put them in the subdirectory under `./database/migrations` folder. 

# Running Web Server

After all of that done without errors, use this command to launch web server:

    npm start

Be sure to build the frontend or run it in development mode to be able to access the site. See the `frontend/README.md` for more information.

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
