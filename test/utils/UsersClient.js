'use strict';

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class UsersClient extends ClientBase {
    constructor(urls) {
        super(urls);
    }

    add(user, callback) {
        RequestWrapper.post(this.urls.users(), null, user, callback);
    }

    update(sessionId, languageId, user, callback) {
        RequestWrapper.put(this.urls.users(),
            this._makeHeaders({sessionId, languId: languageId}), user, callback);
    }
}

module.exports = UsersClient;
