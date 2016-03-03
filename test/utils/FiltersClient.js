'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

class FiltersClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.filtersUrls);
    }
}

module.exports = FiltersClient;
