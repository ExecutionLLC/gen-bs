'use strict';

const Express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const Http = require('http');
const HttpStatus = require('http-status');
const WebSocketServer = require('ws').Server;

const ErrorUtils = require('./utils/ErrorUtils');
const ControllerBase = require('./controllers/base/ControllerBase');
const {sessionLockMiddleware} = require('./sessionsLockMiddleware');

class WebServerHost {
    constructor(controllers, services, models) {
        this.controllers = controllers;
        this.services = services;
        this.models = models;

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.httpServer = Http.createServer();

        this._handleErrors = this._handleErrors.bind(this);
    }

    /**
     * Initializes web server.
     * @param callback (error)
     * */
    start(callback) {
        this._printServerConfig();

        // Create service
        const app = new Express();

        this._enableCORSIfNeeded(app);

        this._warnAboutSettingsIfNeeded();

        this._addMiddleware(app);

        this._configureSession(app);

        this._initRouters(app);

        this._initWebSocketServer(this.httpServer);

        this._startHttpServer(this.httpServer, app);

        // Initialize error handling.
        app.use(this._handleErrors);
        
        this.services.start(callback);
    }

    stop(callback) {
        this.httpServer.close();
        this.services.stop(callback);
    }

    _addMiddleware(app) {
        app.disable('x-powered-by');

        app.use(compression());

        app.use(bodyParser.json());

        app.use(morgan('combined'));

        app.use('/', Express.static('public'));

        app.use(sessionLockMiddleware);
    }

    /**
     * Displays errors when security-critical settings are enabled.
     * */
    _warnAboutSettingsIfNeeded() {
        const showErrorFunc = (boolTrigger, errorMessage) => (boolTrigger) ? this.logger.error(errorMessage) : null;
        showErrorFunc(this.config.allowMultipleUserSessions, 'Multiple user sessions enabled!');
        showErrorFunc(this.config.enableAuthCallbackPorts, 'Authorization callback ports are enabled!');
        showErrorFunc(this.config.enableCORS, 'Cross-origin resource sharing enabled!');
        showErrorFunc(this.config.forceOverrideRedisToLocalhost, 'Forced override Redis host to localhost.');
        showErrorFunc(this.config.disableMakeAnalyzed, 'User fees are disabled!');
        showErrorFunc(this.config.enableFullRightsForDemoUsers, 'Demo users have full rights!');
        showErrorFunc(this.config.disableRequestLimits, 'Requests limits are disabled!');
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

    _configureSession(app) {
        app.use(this.services.sessions.getSessionParserMiddleware());
    }

    _initWebSocketServer(httpServer) {
        const webSocketServer = new WebSocketServer({
            server: httpServer,
            verifyClient: (info, callback) => this.controllers.wsController.verifyWebSocketClient(info, callback)
        });

        const wsController = this.controllers.wsController;
        wsController.addWebSocketServerCallbacks(webSocketServer);
    }

    _initRouters(app) {
        const mainRouterRelativePath = '/api';
        const mainRouter = this.controllers.apiController.createRouter(this.controllers, mainRouterRelativePath);
        app.use(mainRouterRelativePath, mainRouter);
    }

    _handleErrors(error, request, response, next) {
        if (response.headersSent) {
            return next(error);
        }
        const errorObject = ErrorUtils.createInternalError(error);
        this.logger.error(errorObject.message);
        if (error.stack) {
            this.logger.debug(error.stack);
        }
        ControllerBase.sendError(
            response,
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorObject
        );
    }

    _enableCORSIfNeeded(app) {
        app.use(cors({
            origin: this.config.baseUrl,
            credentials: true
        }));
    }
}

module.exports = WebServerHost;
