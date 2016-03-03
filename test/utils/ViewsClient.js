'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

class ViewsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.viewsUrls);
    }
}

module.exports = ViewsClient;
