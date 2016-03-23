'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

export default class CommentsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.commentsUrls());
    }
}
