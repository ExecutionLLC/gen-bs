# Welcome to Genomix FrontEnd Application.

Genomix Frontend Application is intended to do great things for genetics all over the world.

# Organization

####Application lives in frontend folder.

App consists of:

- controllers, the topmost level. This layer is parsing and producing JSON from the actual data.
- services. This is where business logic lives. The services form the actual data. Also access rights are checked here.
- models, which are the data access layer abstraction. Models do actual requests for accessing data sources, such as DB or application service.

# Installation

- First install node and npm as described in main README.
- Go to frontend folder. `cd frontend`
- Install webpack global. `npm install -g webpack`
- Install npm dependencies. `npm install`
- Run dev server. `npm start`

# Development

- All html, css and js lives in `frontend/app` folder.
- Main entry point is `app/app.js`
- CSS lives in `app/assets/css` folder. Entry point for css is `index.less`
- HTML lives in `app/templates`. This is handlebars templates. For us is just html.  Main html file is `index.hbs`
- Open app in browser at `http://localhost:8080/`

######Do not edit index.html directly. It produced automatically.
######Do not edit `../public` directly. It produced automatically.

# Build

- Run `npm run build`
- After running `npm start` at `../` folder ( at root of WS ) you wil see app at `http://localhost:5000/`

   Result of the build webserver wil see at `../public` folder.
