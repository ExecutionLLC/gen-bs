export default class CsvExporter {
    constructor() {
        this.separator = ',';
        this.newLine = '\n';
        this.mimeType = '"application/csv"';
    }

    /**
     * Creates new Blob containing 
     * @param columnsArray Array of objects, each has {id, name}
     * @param data Array of objects, each has {columnId, value}
     * */
    buildBlob(columnsArray, data) {
        const columns = _.map(columnsArray, col => col.name);
        const headerRow = this._createRow(columns);
        const rows = _.map(data, row => {
            const orderedValues = _.map(columnsArray, column => row[column.id] || null);
            return this._createRow(orderedValues);
        });

        const documentBody = headerRow + this.newLine + rows.join(this.newLine);
        return new Blob([documentBody], {type: this.mimeType});
    }

    _createRow(rowValues) {
        return rowValues.join(this.separator);
    }
}