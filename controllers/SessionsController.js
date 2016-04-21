'use strict';

const Uuid = require('node-uuid');
const async = require('async');
const Express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const ControllerBase = require('./base/ControllerBase');

class SessionsController extends ControllerBase {
    constructor(services) {
        super(services);

        this.open = this.open.bind(this);
        this.check = this.check.bind(this);
        this.close = this.close.bind(this);

        this.config = this.services.config;
        this.sessions = this.services.sessions;
        this.authStates = {};
    }

    /**
     * Opens new demo session.
     * */
    open(request, response) {
        async.waterfall([
            (callback) => this.sessions.startDemo(callback),
            (sessionId, callback) => this.sessions.findSessionType(
                sessionId,
                (error, sessionType) => callback(error, {
                    sessionId,
                    sessionType
                })
            )
        ], (error, result) => this.sendErrorOrJson(response, error, result));
    }

    check(request, response) {
        const sessionId = this.getSessionId(request);

        async.waterfall([
            (callback) =>this.sessions.findById(sessionId, callback),
            (sessionId, callback) => this.sessions.findSessionType(
                sessionId,
                (error, sessionType) => callback(error, {
                    sessionId,
                    sessionType
                })
            )
        ], (error, result) => this.sendErrorOrJson(response, error, result));
    }

    close(request, response) {
        const sessionId = this.getSessionId(request);
        this.services.sessions.destroySession(sessionId, (error) => {
            this.sendErrorOrJson(response, error, {
                sessionId
            });
        });
    }

    _parseGoogleProfile(accessToken, refreshToken, profile, callback) {
        this.services.logger.debug('Google profile: ' + JSON.stringify(profile, null, 2));
        const userEmail = profile.emails[0].value;
        callback(null, userEmail);
    }

    _processUserLogin(error, userEmail, request, response, next) {
        if (error) {
            next(error);
        } else {
            if (!userEmail) {
                // User cancelled authentication.
                this._onAuthCompleted(request, response, new Error('User cancelled authentication.'), null);
            } else {
                // User is logged in to Google, try creating session.
                this.logger.info('Creating session for user ' + userEmail);
                this.services.sessions.startForEmail(
                    userEmail,
                    (error, sessionId) => this._onAuthCompleted(request, response, error, sessionId)
                );
            }
        }
    }

    _onAuthCompleted(request, response, error, sessionId) {
        let baseAddress = '/';
        if (this.config.enableAuthCallbackPorts) {
            const authStateKey = request.query.state;
            if (this.authStates[authStateKey]) {
                const callbackPort = this.authStates[authStateKey].callbackPort;
                baseAddress = 'http://localhost:' + callbackPort + '/';
                delete this.authStates[authStateKey];
            }
        }

        let targetUrl = null;
        if (error) {
            targetUrl = baseAddress + '?error=' + encodeURIComponent(error.message);
            this.logger.debug('Auth error: ' + error);
        } else {
            targetUrl = baseAddress + '?sessionId=' + encodeURIComponent(sessionId);
            this.logger.debug('Auth successful');
        }
        this.logger.info('Redirecting to ' + targetUrl);
        response.redirect(targetUrl);
    }

    _configurePassport(router, controllerRelativePath) {
        const baseUrl = this.config.baseUrl;
        const googleClientId = this.config.google.clientId;
        const googleClientSecret = this.config.google.clientSecret;
        const googleRelativeRedirectUrl = '/auth/google/callback';
        const googleFullRedirectUrl = baseUrl + controllerRelativePath + googleRelativeRedirectUrl;

        passport.use(new GoogleStrategy({
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: googleFullRedirectUrl
        }, this._parseGoogleProfile.bind(this)));

        router.use(passport.initialize());
        router.get('/auth/google', (request, response, next) => {
            const callbackPort = request.query['callbackPort'];
            let state = undefined;
            if (callbackPort && this.config.enableAuthCallbackPorts) {
                const authStateKey = Uuid.v4();
                this.authStates[authStateKey] = {
                    callbackPort
                };
                state = authStateKey;
            }

            passport.authenticate('google', {
                scope: [
                    'https://www.googleapis.com/auth/plus.profile.emails.read'
                ],
                returnURL: googleFullRedirectUrl,
                realm: baseUrl,
                session: false,
                state
            })(request, response, next);
        });

        router.get(googleRelativeRedirectUrl, (request, response, next) => {
            const authFunc = passport.authenticate('google', {
                successRedirect: '/',
                failureRedirect: '/'
            }, (error, userEmail, info) => this._processUserLogin(error, userEmail, request, response, next));
            authFunc(request, response, next);
        });
    }

    createRouter(controllerRelativePath) {
        const router = new Express();

        this._configurePassport(router, controllerRelativePath);

        router.post('/', this.open);
        router.put('/', this.check);
        router.delete('/', this.close);

        return router;
    }
}

module.exports = SessionsController;