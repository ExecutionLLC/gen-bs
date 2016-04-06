import ExporterBase from './ExporterBase';

export default class CsvExporter extends ExporterBase {
    constructor() {
        super('application/csv');
        this.separator = ',';
    }

    buildHeaderRow(columnsArray, data) {
        const columnNames = _.map(columnsArray, col => col.name);
        return this._createRow(columnNames);
    }

    buildRow(columnsArray, rowValues, data) {
        return this._createRow(rowValues);
    }

    _createRow(rowValues) {
        return _.map(rowValues, value => this._preprocessRowValue(value))
            .join(this.separator);
    }

    _preprocessRowValue(value) {
        value = (value || '').replace('"', '""');
        return `"${value}"`;
    }
}