'use strict';

import UserEntityClientBase from './UserEntityClientBase';
import RequestWrapper from './RequestWrapper';

export default class SavedFilesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.savedFilesUrls());
    }

    download(languageId, itemId, callback) {
        RequestWrapper.download(
            this.collectionUrls.download(itemId),
            this._makeHeaders({languageId}),
            null,
            callback
        );
    }

    add(languageId, fileMetadata, fileBlob, callback) {
        const formData = {
            file: fileBlob,
            metadata: JSON.stringify(fileMetadata)
        };

        RequestWrapper.uploadMultipart(
            this.collectionUrls.upload(),
            this._makeHeaders({languageId}),
            null,
            formData,
            callback
        );
    }
}
