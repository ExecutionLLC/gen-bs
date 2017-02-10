import pako from 'pako';

import ExportUtils from './exportUtils';

/**
 * gzip file
 * @param {File} file - File for gzip.
 * @returns {Promise} - When resolved promise returns File with gzipped file and with name = file.name + '.gz'
 */
export function gzip(file) {

    const reader = new FileReader();

    const promise = new Promise((resolve) => {
        reader.onload = (e => {
            const ch = new Uint8Array(e.target.result);
            const content = pako.gzip(ch);
            const blobParams = {type: 'application/gzip', lastModified: new Date()};
            // Workaround for bug with File constructor in Safari: #613
            if (ExportUtils.isSafariBrowser()) {
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

/**
 * Check if {file} has gzip identification header bytes (https://tools.ietf.org/html/rfc1952#page-5).
 * */
export function isGzipFormat(file) {
    const twoBytes = file.slice(0, 2);
    const reader = new FileReader();
    const promise = new Promise((resolve) => {
        reader.onload = (e => {
            const array = new Uint8Array(e.target.result);
            resolve(array[0] === 0x1F && array[1] === 0x8B);
        });
    });
    reader.readAsArrayBuffer(twoBytes);
    return promise;
}
