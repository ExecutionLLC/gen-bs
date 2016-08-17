'use strict';

const _ = require('lodash');
const AppServerUtils = require('./AppServerUtils');

class AppServerFilterUtils {
    static createAppServerFilter(filter, fieldIdToMetadata, sample) {
        return AppServerFilterUtils._createServerRulesRecursively(filter.rules, fieldIdToMetadata, sample);
    }

    static _createServerRulesRecursively(filterRulesObject, fieldIdToMetadata, sample) {
        const operator = filterRulesObject['$and'] ? '$and' :
            filterRulesObject['$or'] ? '$or' : null;
        if (operator) {
            const operands = filterRulesObject[operator];
            const mappedOperands = _(operands)
                .map((operand) => AppServerFilterUtils._createServerRulesRecursively(operand, fieldIdToMetadata, sample))
                .filter(operand => operand)
                .value();
            if (_.isEmpty(mappedOperands)) {
                return null;
            }
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            const mappedColumns = _(filterRulesObject)
                .keys()
                // Ignore fields that don't exist, to be able to apply filters formed on other samples.
                .filter(fieldId => fieldIdToMetadata[fieldId])
                .map(fieldId => {
                    const field = fieldIdToMetadata[fieldId];
                    const condition = filterRulesObject[fieldId];
                    return {
                        columnName: AppServerUtils.createColumnName(field.name, sample.genotypeName),
                        sourceName: field.sourceName ==='sample'?AppServerUtils.createSampleName(sample):field.sourceName,
                        condition
                    };
                })
                .value();
            if (!mappedColumns.length) {
                return null;
            } else {
                return mappedColumns[0];
            }
        }
    }
}

module.exports = AppServerFilterUtils;