'use strict';

import _ from 'lodash';

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

    add(languId, sessionId, fileMetadata, fileStream, callback) {
        const formData = _.cloneDeep(fileMetadata);
        formData.file = {
            value: fileStream
        };
        RequestWrapper.post(
            this.collectionUrls.create(),
            this._makeHeaders({sessionId, languId}),
            formData,
            callback
        )
    }
}
