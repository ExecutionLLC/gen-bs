'use strict';

import UserEntityClientBase from './UserEntityClientBase';

export default class ViewsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.viewsUrls());
    }
}
