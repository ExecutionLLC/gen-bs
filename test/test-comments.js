'use strict';

const assert = require('assert');
const _ = require('lodash');
const Uuid = require('node-uuid');
const HttpStatus = require('http-status');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const CommentsClient = require('./utils/CommentsClient');
const ClientBase = require('./utils/ClientBase');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const commentsClient = new CommentsClient(urls);

const languId = Config.defaultLanguId;

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};

describe('Comments', () => {
    let sessionId = null;
    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });

    it('should add new comment for the user', (done) => {
        const commentToAdd = {

        };

    });
});