'use strict';

const QueryString = require('querystring');
const async = require('async');
const _ = require('lodash');
const Express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const ControllerBase = require('./base/ControllerBase');

const Config = require('../utils/Config');
const RegcodesClient = require('../api/RegcodesClient');

class SessionsController extends ControllerBase {
    constructor(controllers, services) {
        super(services);

        this.controllers = controllers;

        _.bindAll(this, [
            this.open.name,
            this.check.name,
            this.close.name,
            this.closeAllUserSessions.name,
            this.closeOpenedSocketsForSession.name
        ]);

        this.config = this.services.config;
        this.sessions = this.services.sessions;

        this.regcodesClient = new RegcodesClient(Config);
    }

    /**
     * Opens new session.
     * */
    open(request, response) {
        const {session, body} = request;
        async.waterfall([
            (callback) => {
                if (body && body.login) {
                    const {login, password} = body;
                    this.sessions.startForEmailPassword(session, login, password, callback);
                } else {
                    this.sessions.startDemo(session, callback)
                }
            },
            (session, callback) => callback(null, {
                    sessionId: session.id,
                    sessionType: session.type
                })
        ], (error, result) => this.sendErrorOrJson(response, error, result));
    }

    check(request, response) {
        const {session, session: {type: sessionType, id: sessionId}} = request;
        if (this.services.sessions.isSessionValid(session)) {
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
        const {session} = request;
        this.services.sessions.destroySession(session, (error) => {
            this.sendErrorOrJson(response, error, {
                sessionId: session.id
            });
        });
    }

    closeAllUserSessions(request, response) {
        const {session: {userEmail}} = request;
        if (userEmail) {
            this.services.sessions.closeAllUserSessions(userEmail, (error) => {
                this.sendErrorOrOk(response, error);
            });
        } else {
            this.sendInternalError(response, 'Please try to login first.');
        }
    }

    closeOpenedSocketsForSession(request, response) {
        const {session} = request;
        if (this.services.sessions.isSessionValid(session)) {
            this.controllers.wsController.closeSocketsForUserIdAsync(session.id)
                .then(() => this.sendOk(response))
                .catch((error) => this.sendInternalError(response, error));
        } else {
            this.sendInternalError(response, new Error('Invalid session.'));
        }
    }

    _parseGoogleProfile(accessToken, refreshToken, profile, callback) {
        this.services.logger.debug('Google profile: ' + JSON.stringify(profile, null, 2));
        const userEmail = profile.emails[0].value;
        const {familyName, givenName} = profile.name;
        callback(null, {firstName: givenName, lastName: familyName, userEmail});
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

        passport.serializeUser((user, callback) => callback(null, user));
        passport.deserializeUser((userId, callback) => this.services.users.find(userId, callback));

        router.use(passport.initialize());
        // Registration code is optional.
        router.get('/auth/google/login/:registrationCodeId?', (request, response, next) => {
            const {session, session: {userEmail}} = request;
            if (!userEmail) {
                const {registrationCodeId} = request.params;
                const authCallback = passport.authenticate('google', {
                    scope: ['profile','email'],
                    returnURL: googleFullRedirectUrl,
                    realm: baseUrl,
                    state: registrationCodeId || '',
                    accessType:'online',
                    approvalPrompt:'auto'
                });
                authCallback(request, response, next);
            } else {
                // User has already logged in.
                this._startUserSession(session, userEmail, response);
            }
        });

        router.get(googleRelativeRedirectUrl, (request, response, next) => {
            const authFunc = passport.authenticate('google', {
                successRedirect: '/',
                failureRedirect: '/'
            }, (error, user) => {
                if (error) {
                    return next(error);
                }
                const {userEmail} = user;
                const registrationCodeId = request.query.state;

                async.waterfall([
                    (callback) => {
                        if (registrationCodeId) {
                            // Activate registration code if any.
                            this.regcodesClient.activateAsync({id: registrationCodeId})
                                .then(() => callback(null));
                        } else {
                            callback(null);
                        }
                    },
                    () => this._startUserSession(request.session, userEmail, response)
                ], (error) => next(error)); // We can be here only in case of an error.

            });
            authFunc(request, response, next);
        });
    }

    _startUserSession(session, email, response) {
        session.userEmail = email;
        this.services.sessions.startForEmail(session, email, (error) => {
            const queryPart = error ? `?error=${QueryString.escape(error.message)}` : '';
            response.redirect(`/${queryPart}`);
        })
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
        router.delete('/all', closeSessionLimiter, this.closeAllUserSessions);
        router.delete('/socket', closeSessionLimiter, this.closeOpenedSocketsForSession);

        return router;
    }
}

module.exports = SessionsController;