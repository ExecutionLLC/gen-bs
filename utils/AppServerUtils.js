'use strict';

const _ = require('lodash');
const {ENTITY_TYPES} = require('./Enums');
const NOT_DUPLICATED_COLUMNS = ['CHROM', 'POS', 'ALT', 'REF'];
const NOT_DUPLICATED_COLUMN_PREFIXES = ['VEP_'];

class AppServerUtils {
    static getGenotypeFieldsPrefix() {
        return 'GT_';
    }

    static getSearchKeyFieldName() {
        return 'search_key';
    }

    static getSearchKeyFieldsColumnNames(){
        return ['ALT', 'CHROM', 'POS', 'REF'];
    }

    static getNotDuplicatedColumnNames(fieldIdToMetadata) {
        const  filteredMetadata = _.filter(fieldIdToMetadata, fieldMetadata => {
            return _.includes(
                    NOT_DUPLICATED_COLUMNS,
                    fieldMetadata.name
                ) || _.some(
                    NOT_DUPLICATED_COLUMN_PREFIXES,
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
            sample.fileName : sample.vcfFileId;
    }
}


module.exports = AppServerUtils;