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

const assertCommentContentsEqual = (comment1, comment2) => {
    assert.ok((!comment1 && !comment2) || (comment1 && comment2));
    assert.equal(comment1.reference, comment2.reference);
    assert.equal(comment1.chrom, comment2.chrom);
    assert.equal(comment1.pos, comment2.pos);
    assert.equal(comment1.alt, comment2.alt);
    assert.equal(comment1.searchKey, comment2.searchKey);
    assert.equal(comment1.comment, comment2.comment);
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

    it('should add and remove comments for user', (done) => {
        const commentToAdd = {
            id: Uuid.v4(),
            reference: 'asd',
            chrom: 'aaa',
            pos: 1234,
            alt: 'cdsa',
            searchKey: 123456,
            comment: 'This is test comment'
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
                assert.ok(_.any(comments, comment => comment.id === addedComment.id));

                commentsClient.remove(sessionId, addedComment.id, (error, response) => {
                    ClientBase.readBodyWithCheck(error, response);

                    done();
                });
            });
        });
    });
});