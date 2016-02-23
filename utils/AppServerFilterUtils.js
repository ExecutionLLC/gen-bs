'use strict';

const _ = require('lodash');

class AppServerFilterUtils {
    static createAppServerFilter(filter, fieldIdToMetadata) {
        return AppServerFilterUtils._createServerRulesRecursively(filter.rules, fieldIdToMetadata);
    }

    static _createServerRulesRecursively(filterRulesObject, fieldIdToMetadata) {
        const operator = filterRulesObject['$and'] ? '$and' :
            filterRulesObject['$or'] ? '$or' : null;
        if (operator) {
            const operands = filterRulesObject[operator];
            const mappedOperands = _.map(operands, (operand) => AppServerFilterUtils._createServerRulesRecursively(operand, fieldIdToMetadata));
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
                        columnName: field.name,
                        sourceName: field.sourceName,
                        condition
                    };
                })
                .value();
            if (mappedColumns.length != 1) {
                throw new Error('Unexpected filter format: there should be only one field condition per object.');
            } else {
                return mappedColumns[0];
            }
        }
    }
}

module.exports = AppServerFilterUtils;