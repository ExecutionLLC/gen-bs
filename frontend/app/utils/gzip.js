import pako from 'pako';

function isSafariBrowser() {
    // Origin: http://stackoverflow.com/questions/7944460/detect-safari-browser
    return navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
        navigator.userAgent && !navigator.userAgent.match('CriOS');
}

/**
 * gzip file
 * @param {File} file - File for gzip.
 * @returns {Promise} - When resolved promise returns File with gzipped file and with name = file.name + '.gz'
 */
export default function gzip(file) {

    const reader = new FileReader();

    const promise = new Promise((resolve) => {
        reader.onload = (e => {
            const ch = new Uint8Array(e.target.result);
            const content = pako.gzip(ch);
            const blobParams = {type: 'application/gzip', lastModified: new Date()};
            // Workaround for bug with File constructor in Safari: #613
            if (isSafariBrowser()) {
                const blob = new Blob([content], blobParams);
                blob.name = file.name;
                resolve(blob);
            } else {
                const theFile = new File([content], file.name + '.gz', blobParams);
                resolve(theFile);
            }
        });
    });

    reader.readAsArrayBuffer(file);
    return promise;
}

