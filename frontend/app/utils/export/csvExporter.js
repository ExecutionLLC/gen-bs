import _ from 'lodash';

import ExporterBase from './ExporterBase';

export default class CsvExporter extends ExporterBase {
    constructor() {
        super('application/csv');
        this.separator = ';';
    }

    /**
     * @param {string[]} columnsArray
     * @returns {string}
     */
    buildHeaderRow(columnsArray) {
        return this._createRow(columnsArray);
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[]} rowValues
     * @returns {string}
     */
    buildRow(columnsArray, rowValues) {
        return this._createRow(rowValues);
    }

    /**
     * @param {string[]} rowValues
     * @returns {string}
     * @private
     */
    _createRow(rowValues) {
        return _.map(rowValues, value => this._preprocessRowValue(value))
            .join(this.separator);
    }

    /**
     * @param {string} value
     * @returns {string}
     * @private
     */
    _preprocessRowValue(value) {
        const escapedValue = (value || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${escapedValue}"`;
    }
}