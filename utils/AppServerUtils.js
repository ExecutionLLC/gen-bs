'use strict';

const _ = require('lodash');
const {ENTITY_TYPES} = require('./Enums');

class AppServerUtils{
    static getGenotypeFieldsPrefix() {
        return 'GT_';
    }

    static getNoneDuplicatedColumnNames(fieldIdToMetadata){
        return ["CHROM","POS"]
    }

    static createColumnName(fieldName, genotypeName){
        if (fieldName.startsWith(AppServerUtils.getGenotypeFieldsPrefix())) {
            return `${fieldName}_${genotypeName}`;
        }
        return fieldName;
    }

    static createSampleName(sample) {
        return _.includes(ENTITY_TYPES.defaultTypes, sample.type) ?
            sample.fileName : sample.originalId;
    }
}


module.exports = AppServerUtils;