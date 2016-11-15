import UserEntityClientBase from './UserEntityClientBase';

export default class SampleUploadsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.sampleUploadsUrls());
    }
}