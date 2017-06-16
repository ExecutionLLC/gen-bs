# NPM Scripts Description

Note that when launching these scripts the settings are loaded from the environment variables. See the full list of settings in [the project config](../utils/Config.js).

* `npm test` - runs all (enabled) tests for WebServer.
* `npm run db:create` - creates database for the project. **Drops existing database if it already exists**.
* `npm run db:prepare` - create db if not exists and applies migrations to a existing database.
* `npm run db:migrate` - applies migrations to a existing database.
* `npm run db:migrate:make` - make migration with specify name (name must be with "-" delimiter).
* `npm run db:reset` - drops and re-creates the latest version of the database, filling it with default data and updating labels for **existing** fields.
* `npm run defaults:import` - imports default data into the database. Fails if the data is already imported.
* `npm run defaults:generate` - re-generates default data for the database from template data. Ids of some default entities will be changed after that operation.
* `npm run labels:update` - updates fields' labels (which are shown to the user instead of names).
* `npm start` - runs WebServer.
* `npm run start-server` - rebuilds frontend and starts server.
* `npm run user:add` - script for adding new users to the database.
* `npm run frontend` - starts frontend in development mode (as a separate server).
* `npm run update` - pulls new commits for the current branch, installs dependencies for frontend and WS, restarts WS using `pm2` and creates tag on the current branch.
    The script is used for updating live Amazon instances.
* `npm run build:webserver` - runs production build of WebServer (creates a single JS file containing all the WS code, minimized and uglified). It is used when building a production Docker container.
* `npm run build:frontend` - runs build for the frontend.
* `npm run build` - runs both frontend and WebServer builds.