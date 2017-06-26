# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

Read about [registration server](docs/regserver.md).

See [general information about the project entities](docs/general-info.md).

Also, read about [the development rules in the project](docs/development.md).

Please also find the [guide for installation and running development environment](docs/installation.md)

In addition, we have [document describing NPM commands available](docs/npm-scripts.md).

# Project Structure

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data which is got from the underlying logic.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here. The services should know nothing about the outer world.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.
- utils, where helper methods are placed, such as snake-to-camel case conversion utility.
- startup contains scripts executing at service start, such as database creation, AS data retrieval, etc.
- defaults, where the database seeds are living.

NPM scripts are used to build and launch anything the project needs.

# Additional Info

Default database data lays in `defaults/` folder.

Part of the default data is imported from the external JSON files and needs some transformations to be imported. Such data lays in `defaults/templates/` folder.

The scripts generating the actual defaults are also kept at the `defaults/` folder. These scripts can be launched by running the following command:

    npm run defaults:generate
    
This needs to be done every time when the default data is changed. The process changes indices of the default fields, users and data, so you'll finish with a lot of files changes even if you did no changes.
