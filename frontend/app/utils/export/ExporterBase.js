import _ from 'lodash';

export default class ExporterBase {
    constructor(mimeType) {
        this.mimeType = mimeType;
        this.newLine = '\n';
    }

    // eslint-disable-next-line
    buildHeaderRow(columnsArray) {
        throw new Error('Not implemented.');
    }

    // eslint-disable-next-line
    buildRow(columnsArray, rowValues) {
        throw new Error('Not implemented.');
    }

    buildDocument(headerRow, rows) {
        return headerRow + this.newLine + rows.join(this.newLine);
    }

    /**
     * Creates new Blob containing data in specified format.
     * @param {string[]} columnsArray Array of column names
     * @param {string[]} data Array of column values
     * */
    buildBlob(columnsArray, data) {
        const headerRow = this.buildHeaderRow(columnsArray);
        const rows = _.map(data, row => {
            return this.buildRow(columnsArray, row);
        });

        const documentBody = this.buildDocument(headerRow, rows);
        const blobType = `"${this.mimeType}"`;
        return new Blob(['\uFEFF' + documentBody], {type: blobType});
    }
}