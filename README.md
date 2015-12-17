# Welcome to Genomix Application WebServer Node

Genomix Application is intended to do great things for genetics all over the world.

Be proud feeling yourself a part of it!

# GIT Workflow

Please see the interactive workflow description here:

https://guides.github.com/introduction/flow/

# Organization

WebServer consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data which is got from the underlying logic.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here. The services should know nothing about the outer world.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.
- utils, where helper methods are placed, such as snake-to-camel case conversion utility.
- startup contains scripts executing at service start, such as database creation, AS data retrieval, etc.

# Installation

Currently, Node v4.2.2 is using. To be able to switch node versions easily in future it is recommended to use Node version manager (NVM), which is downloadable by the link below:

https://github.com/creationix/nvm

After `nvm` is installed and the terminal is relaunched, as `nvm` wants, please type the following:

    nvm install 4.2.2

This will install Node version 4.2.2.

After the proper node version is installed, go to the sources root and execute `npm install` command which will install all project dependencies.

Currently, we have two jQuery plugins installed as submodules. To initialize them, from the sources root execute the following commands:

    git submodule init
    git submodule update

Then, use `npm start` to launch the frontend with WS.

# Deploying to Heroku

This part is not strictly necessary, but it is better to complete it to be sure your changes function well in production.

First, you need to install the Heroku Toolbelt, which is available here:

https://toolbelt.heroku.com/

Next, if you don't have an account, you need to register on Heroku. This can be done by the link below:

https://signup.heroku.com/login

Please execute the following command to login to Heroku

    heroku login

After that execute the following command from the sources root:

    heroku create

This will create a empty Heroku application for you and will show the URL of it in the console. After that you should be able to use the following command to deploy your currently active branch to your Heroku site:

    npm run deploy

# Deploying to the production site

The current customer-ready version of the system is available by the following URL:

http://whispering-forest-5185.heroku.com

If you think you should be able to deploy to it, please send the email you have been using for registration to Vasily Loginov, for him to be able to add you as a collaborator of the application.

When you are said to be a collaborator, please execute the following command from the sources root:

    git remote add production https://git.heroku.com/whispering-forest-5185.git

After that you should be able to deploy to the production site using the following command:

    git push production master

Don't forget about the responsibility of this step.
