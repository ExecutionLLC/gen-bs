'use strict';

const _ = require('lodash');
const AppServerViewUtils = require('./AppServerViewUtils');

class AppServerFilterUtils {
    static createAppServerFilter(filter, fieldIdToMetadata, sampleGenotypeName) {
        return AppServerFilterUtils._createServerRulesRecursively(filter.rules, fieldIdToMetadata, sampleGenotypeName);
    }

    static _createServerRulesRecursively(filterRulesObject, fieldIdToMetadata, sampleGenotypeName) {
        const operator = filterRulesObject['$and'] ? '$and' :
            filterRulesObject['$or'] ? '$or' : null;
        if (operator) {
            const operands = filterRulesObject[operator];
            const mappedOperands = _(operands)
                .map((operand) => AppServerFilterUtils._createServerRulesRecursively(operand, fieldIdToMetadata, sampleGenotypeName))
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
                        columnName: AppServerViewUtils.createAppServerColumnName(
                            field.name,
                            'sample', sampleGenotypeName, false
                        ),
                        sourceName: field.sourceName,
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