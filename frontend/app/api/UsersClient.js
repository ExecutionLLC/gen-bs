'use strict';

import ClientBase from './ClientBase';
import RequestWrapper from './RequestWrapper';

export default class UsersClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    update(user, callback) {
        RequestWrapper.put(this.urls.users(), null, user, callback);
    }
}
