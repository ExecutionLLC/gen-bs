'use strict';

import UserEntityClientBase from './UserEntityClientBase';

export default class FiltersClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.filtersUrls());
    }
}
