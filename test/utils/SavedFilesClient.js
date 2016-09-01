'use strict';

const _ = require('lodash');

const UserEntityClientBase = require('./UserEntityClientBase');
const RequestWrapper = require('./RequestWrapper');

class SavedFilesClient extends UserEntityClientBase {
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

    add(languId ,sessionId, fileMetadata, fileStream, callback) {
        const formData = {
            file: fileStream,
            metadata: JSON.stringify(fileMetadata)
        };

        RequestWrapper.uploadMultipart(
            this.collectionUrls.upload(),
            this._makeHeaders({languId, sessionId}),
            null,
            formData,
            callback
        );
    }
    
}

module.exports = SavedFilesClient;