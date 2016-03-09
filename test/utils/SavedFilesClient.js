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

    add(languId, sessionId, fileMetadata, fileStream, callback) {
        const formData = {
            file: {
                value: fileStream
            },
            viewId: fileMetadata.viewId,
            vcfFileSampleVersionId: fileMetadata.vcfFileSampleVersionId,
            name: fileMetadata.name,
            url: fileMetadata.url,
            totalResults: fileMetadata.totalResults,
            description: fileMetadata.description
        };
        RequestWrapper.post(
            this.collectionUrls.create(),
            this._makeHeaders({sessionId, languId}),
            formData,
            callback
        )
    }
}

module.exports = SavedFilesClient;