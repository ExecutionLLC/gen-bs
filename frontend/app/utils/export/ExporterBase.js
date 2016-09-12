import _ from 'lodash';

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
        const blobType = `"${this.mimeType}"`;
        return new Blob(['\uFEFF' + documentBody], {type: blobType});
    }
}