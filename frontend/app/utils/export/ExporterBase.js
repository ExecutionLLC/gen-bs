export default class ExporterBase {
    constructor(mimeType) {
        this.mimeType = mimeType;
        this.newLine = '\n';
    }

    buildHeaderRow(columnsArray, data) {
        throw new Error('Not implemented.');
    }

    buildRow(columnsArray, rowValues, data) {
        throw new Error('Not implemented.');
    }

    buildDocument(headerRow, rows) {
        return headerRow + this.newLine + rows.join(this.newLine);
    }

    /**
     * Creates new Blob containing data in specified format.
     * @param columnsArray Array of objects, each has {id, name}
     * @param data Array of objects, each is a hash {columnId->value}
     * */
    buildBlob(columnsArray, data) {
        const headerRow = this.buildHeaderRow(columnsArray);
        const rows = _.map(data, row => {
            const orderedValues = _.map(columnsArray, column => row[column.id] || '');
            return this.buildRow(columnsArray, orderedValues, data);
        });

        const documentBody = this.buildDocument(headerRow, rows);
        const blobType = `"${this.mimeType}"`;
        return new Blob(['\uFEFF' + documentBody], {type: blobType});
    }
}