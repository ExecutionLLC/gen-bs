import _ from 'lodash';
import ExporterBase from './ExporterBase';

export default class SqlExporter extends ExporterBase {
    constructor() {
        super('application/sql');

        this.tableName = 'MySamplesTable';
    }

    /**
     * @param {string[]} columnsArray
     * @returns {string}
     */
    // eslint-disable-next-line
    buildHeaderRow(columnsArray) {
        return '';
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[]} rowValues
     * @returns {string}
     */
    buildRow(columnsArray, rowValues) {
        const sqlValues = _.map(rowValues, value => this._prepareValue(value));
        return this.baseSqlQuery + `(${sqlValues.join(', ')});`;
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[][]} data
     * @returns {Blob}
     */
    buildBlob(columnsArray, data) {
        const sqlColumnNames = _.map(columnsArray, col => `"${col}"`);
        this.baseSqlQuery = `INSERT INTO "${this.tableName}" (${sqlColumnNames.join(', ')}) VALUES `;
        return super.buildBlob(columnsArray, data);
    }

    /**
     * @param {string|null|undefined} value
     * @returns {string}
     * @private
     */
    _prepareValue(value) {
        if (value == null) {
            return 'NULL';
        }

        return `'${(value + '').replace(/'/g, "''").replace(/\n/g, ' ')}'`;
    }
}
