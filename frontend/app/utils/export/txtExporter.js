import ExporterBase from './ExporterBase';

export default class TxtExporter extends ExporterBase {
    constructor() {
        super('application/text');
        this.valuesSeparator = ' | ';
    }

    buildHeaderRow(columnsArray) {
        return _.map(columnsArray, column => {
            const valueLength = this.longestValueLengthByColumn[column.id];

            return this._addSpaces(column.name, valueLength);
        }).join(this.valuesSeparator);
    }

    buildRow(columnsArray, rowValues) {
        return _.map(columnsArray, (column, columnIndex) => {
            const rowValue = rowValues[columnIndex];
            const valueLength = this.longestValueLengthByColumn[column.id];
            return this._addSpaces(rowValue, valueLength);
        }).join(this.valuesSeparator);
    }

    buildBlob(columnsArray, data) {
        this.longestValueLengthByColumn = this._getLongestValueLengths(columnsArray, data);
        return super.buildBlob(columnsArray, data);
    }

    _addSpaces(value, length) {
        const spaceCount = length - (value || '').length;
        const spaces = new Array(spaceCount)
            .fill(' ')
            .join('');
        return value + spaces;
    }

    /**
     * Finds longest value for each column, which allows us to build a straight results table later.
     * */
    _getLongestValueLengths(columnsArray, data) {
        return _.reduce(columnsArray, (result, column) => {
            // Find length of the longest value in the column.
            const longestRowValue = _.reduce(data, (maxVal, row) => Math.max((row[column.id] || '').length, maxVal), 0);

            // Take max between the value and the column name length.
            result[column.id] = Math.max(longestRowValue, column.name.length);
            return result;
        }, {});
    }
}

