'use strict';

const ModelBase = require('./ModelBase');

class ModelsModel extends ModelBase {
    constructor(models, baseTableName) {
        super(models, baseTableName, null)
    }
}

module.exports = ModelsModel;
