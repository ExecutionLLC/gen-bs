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
        this.authStates = Object.create(null);
    }

    /**
     * Opens new demo session.
     * */
    open(request, response) {
        const {session} = request;
        async.waterfall([
            (callback) => this.sessions.startDemo(session, callback),
            (session, callback) => callback(null, {
                    sessionId: session.id,
                    sessionType: session.type
                })
        ], (error, result) => this.sendErrorOrJson(response, error, result));
    }

    check(request, response) {
        const {session, session:{type:sessionType, id:sessionId}} = request;
        if (sessionType) {
            async.waterfall([
                (callback) => this.services.operations.keepOperationsAlive(session, callback)
            ], (error) => this.sendErrorOrJson(response, error, {
                sessionId,
                sessionType
            }));
        } else {
            this.sendInternalError(response, new Error('Session is not found.'));
        }
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
        async.waterfall([
            (callback) => this.services.users.models.users.findIdByEmail(userEmail, callback),
            (userId, callback) => this.services.users.models.users.find(userId, callback)
        ], callback);
    }

    _onAuthCompleted(request, response, error, session) {
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
            targetUrl = baseAddress + '?sessionId=' + encodeURIComponent(session.id);
            this.logger.debug('Auth successful');
        }
        this.logger.debug('Redirecting to ' + targetUrl);
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

        passport.serializeUser((user, callback) => callback(null, user.id));
        passport.deserializeUser((userId, callback) => this.services.users.find(userId, callback));

        router.use(passport.initialize());
        router.get('/auth/google', passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read'],
            returnURL: googleFullRedirectUrl,
            realm: baseUrl
        }));

        router.get(googleRelativeRedirectUrl, (request, response, next) => {
            const authFunc = passport.authenticate('google', {
                successRedirect: '/',
                failureRedirect: '/'
            }, (error, user, info) => {
                if (error) {
                    return next(error);
                }
                request.login(user, (error) => {
                    request.session.type = 'USER';
                    request.session.userId = user.id;
                    response.redirect('/');
                });
            });
            authFunc(request, response, next);
        });
    }

    createRouter(controllerRelativePath) {
        const router = new Express();

        this._configurePassport(router, controllerRelativePath);

        const openSessionLimiter = this.createLimiter({
            noDelayCount: 2, // allow only two sessions before starting to delay
            delayMs: 3 * 1000, // delay to 3 seconds
            maxCallCountBeforeBlock: 10 // allow create sessions only ten times before delay
        });

        const checkSessionLimiter = this.createLimiter({
            noDelayCount: 1,
            delayMs: 500
        });

        const closeSessionLimiter = this.createLimiter({
            noDelayCount: 2,
            delayMs: 500
        });

        router.post('/', openSessionLimiter, this.open);
        router.put('/', checkSessionLimiter, this.check);
        router.delete('/', closeSessionLimiter, this.close);

        return router;
    }
}

module.exports = SessionsController;