'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

class ModelsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.modelsUrls());
    }
}

module.exports = ModelsClient;