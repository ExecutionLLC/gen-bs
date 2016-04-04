export default class CsvExporter {
    constructor() {
        this.separator = ',';
        this.newLine = '\n';
        this.mimeType = '"application/csv"';
    }

    /**
     * Creates new Blob containing data in specified format. 
     * @param columnsArray Array of objects, each has {id, name}
     * @param data Array of objects, each is a hash {columnId->value}
     * */
    buildBlob(columnsArray, data) {
        const columnNames = _.map(columnsArray, col => col.name);
        const headerRow = this._createRow(columnNames);
        const rows = _.map(data, row => {
            const orderedValues = _.map(columnsArray, column => row[column.id] || '');
            return this._createRow(orderedValues);
        });

        const documentBody = headerRow + this.newLine + rows.join(this.newLine);
        return new Blob([documentBody], {type: this.mimeType});
    }

    _createRow(rowValues) {
        return _.map(rowValues, value => `"${value}"`)
            .join(this.separator);
    }
}