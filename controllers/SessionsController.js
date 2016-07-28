'use strict';

const QueryString = require('querystring');
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

    _parseGoogleProfile(accessToken, refreshToken, profile, callback) {
        this.services.logger.debug('Google profile: ' + JSON.stringify(profile, null, 2));
        const userEmail = profile.emails[0].value;
        callback(null, userEmail);
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
            }, (error, userEmail, info) => {
                if (error) {
                    return next(error);
                }
                this.services.sessions.startForEmail(request.session, userEmail, (error) => {
                    const queryPart = error ? `?error=${QueryString.escape(error.message)}` : '';
                    response.redirect(`/${queryPart}`);
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