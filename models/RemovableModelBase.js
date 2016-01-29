'use strict';

const ModelBase = require('./ModelBase');

class RemovableModelBase extends ModelBase {
    /**
     * @param models Reference to the models facade
     * @param baseTableName Name of the main (or the only) table of the corresponding model.
     * @param mappedColumns List of column names that will be allowed to extract from the table(s) (@see ModelBase._mapColumns() method).
     * */
    constructor(models, baseTableName, mappedColumns) {
        super(models, baseTableName, mappedColumns);
    }

    remove(id, callback) {
        super._unsafeUpdate(id, {isDeleted: true}, callback);
    }
}

module.exports = RemovableModelBase;