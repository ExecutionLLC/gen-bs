'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

export default class ViewsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.viewsUrls());
    }
}
