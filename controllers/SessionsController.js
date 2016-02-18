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

    authenticateWithGoogle(request, response, next) {

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

    createRouter() {
        const baseUrl = this.services.config.baseUrl;
        const googleClientId = this.services.config.google.clientId;
        const googleClientSecret = this.services.config.google.clientSecret;
        const googleRelativeRedirectUrl = ;
        const googleFullRedirectUrl = baseUrl + googleRelativeRedirectUrl;

        passport.use(new GoogleStrategy({
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: googleFullRedirectUrl
        }));

        const router = new Express();

        router.use(passport.initialize());
        router.get('/google', passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/plus.profile.emails.read'
            ],
            returnURL: googleFullRedirectUrl,
            realm: baseUrl,
            session: false
        }));
        router.get(googleRelativeRedirectUrl)

        router.post('/', this.open);
        router.put('/', this.check);
        router.delete('/', this.close);

        return router;
    }
}

module.exports = SessionsController;