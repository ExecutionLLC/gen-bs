'use strict';

import UserEntityClientBase from './UserEntityClientBase';

export default class CommentsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.commentsUrls());
    }
}
