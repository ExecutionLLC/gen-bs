'use strict';

import UserEntityClientBase from './UserEntityClientBase';
import RequestWrapper from './RequestWrapper';

export default class SavedFilesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.savedFilesUrls());
    }

    download(languId, itemId, callback) {
        RequestWrapper.download(
            this.collectionUrls.download(itemId),
            this._makeHeaders({languId}),
            null,
            callback
        );
    }

    add(languId, fileMetadata, fileBlob, callback) {
        const formData = {
            file: fileBlob,
            metadata: JSON.stringify(fileMetadata)
        };

        RequestWrapper.uploadMultipart(
            this.collectionUrls.upload(),
            this._makeHeaders({languId}),
            null,
            formData,
            callback
        );
    }
}
