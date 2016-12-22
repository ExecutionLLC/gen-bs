'use strict';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

export default class SamplesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.samplesUrls());
    }

    getFields(sampleId, callback) {
        RequestWrapper.get(this.urls.getSampleFields(sampleId), null, null, null, callback);
    }

    getSourcesFields(callback) {
        RequestWrapper.get(this.urls.getSourcesFields(), null, null, null, callback);
    }

    getAllFields(callback) {
        RequestWrapper.get(this.urls.getAllFields(), null, null, null, callback);
    }

    add(fileName, fileStream, callback) {
        RequestWrapper.upload(this.collectionUrls.upload(),
            'sample',
            fileName,
            fileStream,
            null,
            {},
            callback
        );
    }
}
