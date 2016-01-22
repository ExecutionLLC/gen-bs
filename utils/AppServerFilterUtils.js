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
                .map(fieldId => {
                    const field = fieldIdToMetadata[fieldId];
                    if (!field) {
                        throw new Error('Field is not found for id ' + fieldId);
                    }
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