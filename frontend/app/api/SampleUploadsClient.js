import UserEntityClientBase from './UserEntityClientBase';

import config from '../../config';

export default class SampleUploadsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.sampleUploadsUrls());
    }

    upload(file, onProgress, onComplete) {

        const formData = new FormData();
        formData.append('sample', file);
        formData.append('fileName', file.name);
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                let resp;
                if (request.status === 200) {
                    try {
                        resp = JSON.parse(request.response);
                    } catch (err) { }
                }
                if (!resp) {
                    onComplete(new Error('Invalid upload response'));
                } else {
                    onComplete(null, resp.upload);
                }
            }
        };
        if (request.upload) {
            request.upload.addEventListener('progress', (progress) => {
                const percentage = Math.floor((progress.loaded / progress.total) * 100);
                if (percentage === 100) {
                    console.log('sendFile DONE!');
                }
                onProgress(percentage);
            });
        }
        request.open('POST', config.URLS.FILE_UPLOAD);
        request.send(formData);

        function breakUpload() {
            console.log('breakUpload');
        }

        return breakUpload;
    }
}