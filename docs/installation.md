# Installation

Web server uses the following external services: 

* RabbitMQ for communication with the Application Server
* Redis as a user session storage
* Postgres as a database server
* Amazon S3 to store exported files (or co-called saved files) and upload samples to the Application Server.

Use environment variables to configure access to these services. The names of the variables along with their defaults can be found in the `utils/Config.js` file.

## Storages

Web server need to store some data, like saved files and sample. Available two type of storage: `file` and `s3`. To setup storage setup `GEN_WS_OBJECT_STORAGE_TYPE`.
Storage settings:
- Amazon storage:
    - `GEN_WS_S3_ACCESS_KEY_ID` - amazon access key setting
    - `GEN_WS_S3_ACCESS_KEY_SECRET` - amazon access key secret setting
    - `GEN_WS_S3_REGION_NAME` - amazon region name
    - `GEN_WS_S3_SAVED_FILES_BUCKET_NAME` - bucket for saved files 
    - `GEN_WS_S3_NEW_SAMPLES_BUCKET_NAME` - bucket for uploaded samples
- FileSystem setting 
    - `GEN_WS_FILE_SAVED_FILES_PATH` - full path for saved files location folder 
    - `GEN_WS_FILE_NEW_SAMPLES_PATH` - full path for uploaded samples location folder

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

This command will drop (if exists) and re-create the database and fill it with default values. **Use with caution**, as you will loose your current database. Use `npm run db:migrate` if you want to update database in production.

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