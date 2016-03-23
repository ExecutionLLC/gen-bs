'use strict';

const UserEntityClientBase = require('./UserEntityClientBase');

export default class FiltersClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.filtersUrls());
    }
}
