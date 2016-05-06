import ExporterBase from './ExporterBase';

export default class SqlExporter extends ExporterBase {
    constructor() {
        super('application/sql');

        this.tableName = 'MySamplesTable';
    }

    buildHeaderRow(columnsArray, data) {
        return '';
    }

    buildRow(columnsArray, rowValues, data) {
        const sqlValues = _.map(rowValues, value => this._prepareValue(value));
        return this.baseSqlQuery + `(${sqlValues.join(', ')});`;
    }

    buildBlob(columnsArray, data) {
        const sqlColumnNames = _.map(columnsArray, col => `"${col.name}"`);
        this.baseSqlQuery = `INSERT INTO "${this.tableName}" (${sqlColumnNames.join(', ')}) VALUES `;
        return super.buildBlob(columnsArray, data);
    }

    _prepareValue(value) {
        if (value === null || value === undefined) {
            return 'NULL';
        }

        if (value.constructor === String) {
            return `'${value.replace(/'/g, "''")}'`;
        }

        return value;
    }
}
