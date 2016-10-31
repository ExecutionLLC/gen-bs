import _ from 'lodash';

import ExportUtils from '../exportUtils';

export default class ExporterBase {
    /**
     * @param {string} mimeType
     */
    constructor(mimeType) {
        this.mimeType = mimeType;
        this.newLine = '\n';
    }

    /**
     * @param {string[]} columnsArray
     * @returns string
     */
    // eslint-disable-next-line
    buildHeaderRow(columnsArray) {
        throw new Error('Not implemented.');
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[]} rowValues
     */
    // eslint-disable-next-line
    buildRow(columnsArray, rowValues) {
        throw new Error('Not implemented.');
    }

    /**
     * @param {string} headerRow
     * @param {string[]} rows
     * @returns {string}
     */
    buildDocument(headerRow, rows) {
        return headerRow + this.newLine + rows.join(this.newLine);
    }

    /**
     * Creates new Blob containing data in specified format.
     * @param {string[]} columnsArray Array of column names
     * @param {string[][]} data Array of column values
     * @returns {Blob}
     * */
    buildBlob(columnsArray, data) {
        const headerRow = this.buildHeaderRow(columnsArray);
        const rows = _.map(data, /**string[]*/row => this.buildRow(columnsArray, row));

        const documentBody = this.buildDocument(headerRow, rows);
        // Workaround for bug with Blobs downloading in Safari (#613): just display the result as text.
        const blobType = ExportUtils.isSafariBrowser() ? `text/plain;charset=${document.characterSet}`
            : `${this.mimeType}`;
        return new Blob(['\uFEFF' + documentBody], {type: blobType});
    }
}