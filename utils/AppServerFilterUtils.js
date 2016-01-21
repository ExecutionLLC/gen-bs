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
            const mappedOperands = _.map(operands, AppServerFilterUtils._createServerRulesRecursively);
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            _(filterRulesObject)
                .keys()
                .map(fieldId => {
                    const field = fieldIdToMetadata[fieldId];
                    const condition = filterRulesObject[fieldId];
                    return {
                        columnName: field.name,
                        sourceName: field.sourceName,
                        condition
                    };
                });
        }
    }
}

module.exports = AppServerFilterUtils;