'use strict';

const Express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const Http = require('http');
const WebSocketServer = require('ws').Server;

class WebServerHost {
    constructor(controllers, services, models) {
        this.controllers = controllers;
        this.services = services;
        this.models = models;

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.httpServer = Http.createServer();
    }

    /**
     * Initializes web server.
     * @param callback (error)
     * */
    start(callback) {
        // Create service
        const app = new Express();

        this._printServerConfig();

        this._enableCORSIfNeeded(app);

        this._warnMultipleUserSessionsEnabled();

        this._addMiddleware(app);

        this._initRouters(app);

        this._initWebSocketServer(this.httpServer);

        this._startHttpServer(this.httpServer, app);

        callback(null);
    }

    stop(callback) {
        this.httpServer.close();
        callback(null);
    }

    _addMiddleware(app) {
        app.use(bodyParser.json());

        app.use(morgan('combined'));

        app.use('/', Express.static('public'));
    }

    _warnMultipleUserSessionsEnabled() {
        if (this.config.allowMultipleUserSessions) {
            this.logger.error('Multiple user sessions enabled!');
        }
    }

    _printServerConfig() {
        this.logger.info('Server config:');
        this.logger.info(JSON.stringify(this.services.config, null, 2));
    }

    _startHttpServer(httpServer, app) {
        // Send all requests to Express.
        httpServer.on('request', app);

        httpServer.listen(this.config.port, () => {
            const host = httpServer.address().address;
            const port = httpServer.address().port;

            this.logger.info('Welcome to Genomix WebServer! The server is started on http://' + host + ':' + port);
        });

    }

    _initWebSocketServer(httpServer) {
        const webSocketServer = new WebSocketServer({
            server: httpServer
        });

        const wsController = this.controllers.wsController;
        wsController.addWebSocketServerCallbacks(webSocketServer);
    }

    _initRouters(app) {
        const mainRouterRelativePath = '/api';
        const mainRouter = this.controllers.apiController.createRouter(this.controllers, mainRouterRelativePath);
        app.use(mainRouterRelativePath, mainRouter);
    }

    _enableCORSIfNeeded(app) {
        if (this.config.enableCORS) {
            this.logger.error('Cross-origin resource sharing enabled!');
            app.use(cors());
        }
    }
}

module.exports = WebServerHost;
