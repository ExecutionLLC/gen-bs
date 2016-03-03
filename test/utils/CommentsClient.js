'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

class CommentsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.commentsUrls());
    }
}