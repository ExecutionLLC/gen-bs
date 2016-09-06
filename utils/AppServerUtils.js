'use strict';

const _ = require('lodash');
const {ENTITY_TYPES} = require('./Enums');
const ignoredColumnNames = ['CHROM', 'POS'];
const ignoredColumnPrefixes = ['VEP_'];

class AppServerUtils {
    static getGenotypeFieldsPrefix() {
        return 'GT_';
    }

    static getSearchKeyFieldName() {
        return 'search_key';
    }

    static getSearchKeyFieldsColumnNames(){
        return ['ALT', 'CHROM', 'POS', 'REF']
    }

    static getNoneDuplicatedColumnNames(fieldIdToMetadata) {
        const  filteredMetadata = _.filter(fieldIdToMetadata, fieldMetadata => {
            return _.includes(
                    ignoredColumnNames,
                    fieldMetadata.name
                ) || _.some(
                    ignoredColumnPrefixes,
                    prefix => {
                        return fieldMetadata.name.startsWith(prefix);
                    }
                )
        });
       return _.map(filteredMetadata, field => field.name);
    }

    static createColumnName(fieldName, genotypeName) {
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