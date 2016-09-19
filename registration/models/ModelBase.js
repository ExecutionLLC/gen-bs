'use strict';

const _ = require('lodash');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');

class ModelBase {
    /**@typedef {Object} ModelBase
     * @property {KnexWrapper} db
     * @property {Logger} logger
     * @property {string} baseTableName
     * @property {string[]} mappedColumns
     **/

    /**
     * @param {KnexWrapper} db
     * @param {Logger} logger
     * @param {string} baseTableName Name of the main (or the only) table of the corresponding model.
     * @param {string[]} mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(db, logger, baseTableName, mappedColumns) {
        this.db = db;
        this.logger = logger;
        this.baseTableName = baseTableName;
        this.mappedColumns = mappedColumns;
    }

    _mapColumns(item) {
        const itemData = ChangeCaseUtil.convertKeysToCamelCase(item);
        return CollectionUtils.createHash(this.mappedColumns,
            _.identity,
            (column) => itemData[column]
        );
    }
}

module.exports = ModelBase;