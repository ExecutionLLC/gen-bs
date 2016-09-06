'use strict';

const _ = require('lodash');
const {ENTITY_TYPES} = require('./Enums');
const ignoredColumnNames = ['CHROM', 'POS'];
const ignoredColumnPrefixes = ['VEP_'];
const excludedColumnNames = ['ALT', 'CHROM', 'POS', 'REF'];

class AppServerUtils {
    static getGenotypeFieldsPrefix() {
        return 'GT_';
    }

    static getSearchKeyFieldName() {
        return 'search_key';
    }

    static getExcludedColumnNames(fieldsMetadata){
        const excludedColumnNames = _.filter(
            excludedColumnNames,excludedColumnName =>  {
                return !_.some(fieldsMetadata, fieldMetadata => fieldMetadata.name == excludedColumnName)
            }
        );
        return _.union(excludedColumnNames, AppServerUtils.getSearchKeyFieldName())
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