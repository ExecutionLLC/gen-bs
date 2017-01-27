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

const assertCommentContentsEqual = (addedComment, originalComment) => {
    assert.ok((!addedComment && !originalComment) || (addedComment && originalComment));
    assert.equal(addedComment.reference, originalComment.reference);
    assert.equal(addedComment.chrom, originalComment.chrom);
    assert.equal(addedComment.pos, originalComment.pos);
    assert.equal(addedComment.alt, originalComment.alt);
    assert.equal(addedComment.searchKey, originalComment.searchKey);
    assert.equal(addedComment.comment, originalComment.comment);
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
    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
            done();
        });
    });

    it('should add and remove comments for user', (done) => {
        const commentToAdd = {
            id: Uuid.v4(),
            reference: 'asd',
            chrom: 'aaa',
            pos: 1234,
            alt: 'cdsa',
            searchKey: 123456,
            text: [
                {
                    languageId: null,
                    comment: 'This is test comment'
                }
            ]
        };
        commentsClient.add(sessionId, languId, commentToAdd, (error, response) => {
            const addedComment = ClientBase.readBodyWithCheck(error, response);
            assert.ok(addedComment);
            assert.ok(addedComment.id);
            assert.notEqual(addedComment.id, commentToAdd.id);
            assertCommentContentsEqual(addedComment, commentToAdd);

            commentsClient.getAll(sessionId, (error, response) => {
                const comments = ClientBase.readBodyWithCheck(error, response);
                assert.ok(comments && comments.length);
                assert.ok(_.some(comments, {id: addedComment.id}));

                commentsClient.remove(sessionId, addedComment.id, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);

                    done();
                });
            });
        });
    });
});