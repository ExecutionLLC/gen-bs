'use strict';

const Express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const ControllerBase = require('./ControllerBase');

class SessionsController extends ControllerBase {
    constructor(services) {
        super(services);

        this.open = this.open.bind(this);
        this.check = this.check.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * Opens new session, either demo or user, depending on the user name and password presence in the request.
     * */
    open(request, response) {
        const body = this.getRequestBody(request, response);
        if (!body) {
            return;
        }
        const userName = body.userName;
        const password = body.password;

        const createSessionCallback = (error, sessionId) => {
            this.sendErrorOrJson(response, error, {
                sessionId
            });
        };

        if (userName && password) {
            this.services.sessions.startForUser(userName, password, createSessionCallback);
        } else {
            // open demo session
            this.services.sessions.startDemo(createSessionCallback);
        }
    }

    check(request, response) {
        const sessionId = this.getSessionId(request);

        this.services.sessions.findById(sessionId, (error, sessionId) => {
            this.sendErrorOrJson(response, error, {
                sessionId
            });
        });
    }

    close(request, response) {
        const sessionId = this.getSessionId(request);
        this.services.sessions.destroySession(sessionId, (error) => {
            this.sendErrorOrJson(response, error, {});
        });
    }

    _parseGoogleProfile(accessToken, refreshToken, profile, callback) {
        this.services.logger.debug('Google profile: ' + JSON.stringify(profile, null, 2));
        const userEmail = profile.emails[0].value;
        callback(null, userEmail);
    }

    _processUserLogin(error, userEmail, request, response, next) {
        if (error) {
            return next(error);
        }
        if (!userEmail) {
            // User cancelled authentication.
            return response.redirect('/');
        }
        // User is logged in to Google, try creating session.
        this.services.logger.info('Creating session for user ' + userEmail);
        this.services.sessions.startForEmail(userEmail, (error, sessionId) => {
            if (error) {
                response.redirect('/?error=' + error.message);
            } else {
                return response.redirect('/?sessionId=' + sessionId);
            }
        });
    }

    _configurePassport(router, controllerRelativePath) {
        const baseUrl = this.services.config.baseUrl;
        const googleClientId = this.services.config.google.clientId;
        const googleClientSecret = this.services.config.google.clientSecret;
        const googleRelativeRedirectUrl = '/auth/google/callback';
        const googleFullRedirectUrl = baseUrl + controllerRelativePath + googleRelativeRedirectUrl;

        passport.use(new GoogleStrategy({
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: googleFullRedirectUrl
        }, this._parseGoogleProfile.bind(this)));

        router.use(passport.initialize());
        router.get('/auth/google', passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.profile.emails.read'
            ],
            returnURL: googleFullRedirectUrl,
            realm: baseUrl,
            session: false
        }));
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

        router.get('/', (request, response) => {
            response.json({
                hello: 'world'
            });
        });
        router.post('/', this.open);
        router.put('/', this.check);
        router.delete('/', this.close);

        return router;
    }
}

module.exports = SessionsController;