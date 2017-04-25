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
const cookie = require('cookie');
const signature = require('cookie-signature');

const Config = require('./utils/Config');

const ErrorUtils = require('./utils/ErrorUtils');
const ControllerBase = require('./controllers/base/ControllerBase');

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

        const sessionsCounter = {};

        app.use((req, res, next) => {

            // for given from express-sessions functions
            function debug(s) {
                console.log(s);
            }

            // from express-session
            function unsigncookie(val, secrets) {
                for (var i = 0; i < secrets.length; i++) {
                    var result = signature.unsign(val, secrets[i]);

                    if (result !== false) {
                        return result;
                    }
                }

                return false;
            }

            // from express-session
            function getcookie(req, name, secrets) {
                var header = req.headers.cookie;
                var raw;
                var val;

                // read from cookie header
                if (header) {
                    var cookies = cookie.parse(header);

                    raw = cookies[name];

                    if (raw) {
                        if (raw.substr(0, 2) === 's:') {
                            val = unsigncookie(raw.slice(2), secrets);

                            if (val === false) {
                                debug('cookie signature invalid');
                                val = undefined;
                            }
                        } else {
                            debug('cookie unsigned')
                        }
                    }
                }

                // back-compat read from cookieParser() signedCookies data
                if (!val && req.signedCookies) {
                    val = req.signedCookies[name];

                    if (val) {
                        deprecate('cookie should be available in req.headers.cookie');
                    }
                }

                // back-compat read from cookieParser() cookies data
                if (!val && req.cookies) {
                    raw = req.cookies[name];

                    if (raw) {
                        if (raw.substr(0, 2) === 's:') {
                            val = unsigncookie(raw.slice(2), secrets);

                            if (val) {
                                deprecate('cookie should be available in req.headers.cookie');
                            }

                            if (val === false) {
                                debug('cookie signature invalid');
                                val = undefined;
                            }
                        } else {
                            debug('cookie unsigned')
                        }
                    }
                }

                return val;
            }

            // debug code
            const r = Math.floor(Math.random() * 900 + 100);

            const sessionId = getcookie(req, Config.sessions.sessionCookieName, [Config.sessions.sessionSecret]);

            // debug code
            console.log(`>>> ${r} ${sessionId} ${sessionsCounter[sessionId] ? sessionsCounter[sessionId].length : '-'}`);

            function letGoNext() {
                if (!sessionsCounter[sessionId]) {
                    // debug code
                    console.log(`>>> ${r} let go next: no array`);
                    return;
                }
                const nextF = sessionsCounter[sessionId].shift();
                if (nextF) {
                    // debug code
                    console.log(`>>> ${r} let go next, queue len ${sessionsCounter[sessionId].length}`);
                    nextF();
                } else {
                    // debug code
                    console.log(`>>> ${r} no next, del queue`);
                    delete sessionsCounter[sessionId];
                }
            }

            res.on('finish', () => {
                // debug code
                console.log(`<<< ${r} finish`);
                letGoNext();
            });
            res.on('close', () => {
                // debug code
                console.log(`<<< ${r} close`);
                letGoNext();
            });

            if (!sessionsCounter[sessionId]) {
                // debug code
                console.log(`>>> ${r} [] enter first`);
                sessionsCounter[sessionId] = [];
                next();
            } else {
                // debug code
                console.log(`>>> ${r} ++ wait`);
                sessionsCounter[sessionId].push(() => {
                    // debug code
                    console.log(`>>> ${r} >>> can proceed`);
                    next();
                });
            }
        });

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
