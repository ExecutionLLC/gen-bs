'use strict';

import UserEntityClientBase from './UserEntityClientBase';
import RequestWrapper from './RequestWrapper';

export default class SavedFilesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.savedFilesUrls());
    }

    download(languId, sessionId, itemId, callback) {
        RequestWrapper.get(
            this.collectionUrls.download(itemId),
            this._makeHeaders({sessionId, languId}),
            null,
            null,
            callback
        );
    }
}
