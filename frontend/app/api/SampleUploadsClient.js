import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

import config from '../../config';

export default class SampleUploadsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.sampleUploadsUrls());
    }

    upload(file, onProgress, onComplete) {
        return RequestWrapper.upload(
            config.URLS.FILE_UPLOAD,
            null,
            null,
            file,
            onProgress,
            onComplete
        );
    }
}