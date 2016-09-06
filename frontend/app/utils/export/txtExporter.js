import _ from 'lodash';
import ExporterBase from './ExporterBase';

export default class TxtExporter extends ExporterBase {
    constructor() {
        super('application/text');
        this.valuesSeparator = ' | ';
        /** @type {number[]} */
        this.longestValueLengthByColumn = [];
    }

    /**
     * @param {string[]} columnsArray
     * @returns {string}
     */
    buildHeaderRow(columnsArray) {
        return _.map(columnsArray, (column, index) => {
            const valueLength = this.longestValueLengthByColumn[index];
            return this._addSpaces(column, valueLength);
        }).join(this.valuesSeparator);
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[]} rowValues
     * @returns {string}
     */
    buildRow(columnsArray, rowValues) {
        return _.map(columnsArray, (column, columnIndex) => {
            const rowValue = rowValues[columnIndex];
            const valueLength = this.longestValueLengthByColumn[columnIndex];
            return this._addSpaces(rowValue, valueLength);
        }).join(this.valuesSeparator);
    }

    /**
     * @param {string[]} columnsArray
     * @param {string[][]} data
     * @returns {Blob}
     */
    buildBlob(columnsArray, data) {
        this.longestValueLengthByColumn = this._getLongestValueLengths(columnsArray, data);
        return super.buildBlob(columnsArray, data);
    }

    /**
     * @param {string|null} value
     * @param {number} length
     * @returns {string}
     * @private
     */
    _addSpaces(value, length) {
        const spaceCount = length - ('' + value).length;
        const spaces = new Array(spaceCount)
            .fill(' ')
            .join('');
        return value + spaces;
    }

    /**
     * Finds longest value for each column, which allows us to build a straight results table later.
     * @param {string[]} columnsArray
     * @param {string[][]} data
     * @returns {number[]}
     * @private
     */
    _getLongestValueLengths(columnsArray, data) {
        return _.reduce(columnsArray, (result, column, columnIndex) => {
            // Find length of the longest value in the column.
            const longestRowValue = _.reduce(data, (maxVal, row) => Math.max((row[columnIndex] || '').length, maxVal), 0);
            // Take max between the value and the column name length.
            result.push(Math.max(longestRowValue, column.length));
            return result;
        }, []);
    }
}

