import _ from 'lodash';

import ExporterBase from './ExporterBase';

export default class CsvExporter extends ExporterBase {
    constructor() {
        super('application/csv');
        this.separator = ';';
    }

    buildHeaderRow(columnsArray) {
        return this._createRow(columnsArray);
    }

    buildRow(columnsArray, rowValues) {
        return this._createRow(rowValues);
    }

    _createRow(rowValues) {
        return _.map(rowValues, value => this._preprocessRowValue(value))
            .join(this.separator);
    }

    _preprocessRowValue(value) {
        value = (value || '').replace(/"/g, '""');
        return `"${value}"`;
    }
}