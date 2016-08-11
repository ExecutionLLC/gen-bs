# Welcome to Genomix FrontEnd Browser Application.

Genomix Frontend Application is intended to do great things for genetics all over the world.

# Organization

####Application lives in frontend folder.

App consists of:

- Html handlebars templates for html devs.
- Flux like architecture for js app with actions and stores.
- jQuery for DOM manipulation.
- jQuery plugins and components for rapid prototyping.

# Installation

- First install node and npm as described in main README.
- Go to frontend folder. `cd frontend`
- Install webpack global. `npm install -g webpack`
- Install npm dependencies. `npm install`
- Install nginx `apt-get install nginx`, copy its config `nginx-dev.conf` to the `/etc/nginx/sites-available` and rename it as `default` (Ubuntu nginx config lays here), reload config `nginx -s reload`. Now nginx will redirect all `/api/*` requests (including websockets) to the `127.0.0.1:5000` and all other requests to the `127.0.0.1:8080`.
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

Frontend depends on web server API and should be built with knowledge about the API host and port.

To configure it during build, you can use the following environment variables:

- `GEN_FRONTEND_API_HOST` - API host, ex. `localhost`
- `GEN_FRONTEND_API_PORT` - API port, ex. `8888`

To build frontend for a specific host and port use the following command:

```
    GEN_FRONTEND_API_HOST=ec2-52-90-189-83.compute-1.amazonaws.com GEN_FRONTEND_API_PORT=8080 npm run build
```

Or, just put the proper values into your `.bashrc` or whatever file.

   Result of the build will be available at the `../public` folder, which is served by WS as static content.

