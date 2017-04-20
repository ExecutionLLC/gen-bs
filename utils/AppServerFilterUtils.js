'use strict';

const _ = require('lodash');
const AppServerUtils = require('./AppServerUtils');

class AppServerFilterUtils {
    static createAppServerFilter(filter, fieldIdToMetadata, sample) {
        return AppServerFilterUtils._createServerRulesRecursively(filter.rules, fieldIdToMetadata, sample);
    }

    static _createServerRulesRecursively(filterRulesObject, fieldIdToMetadata, sample) {
        const operator = filterRulesObject.condition || null;
        if (operator) {
            const operands = filterRulesObject.rules;
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
            const {field, operator, value} = filterRulesObject;
            const fieldMetadata = fieldIdToMetadata[field];
            if (fieldMetadata) {
                const columnName = fieldMetadata.sourceName === 'sample' ? AppServerUtils.createColumnName(fieldMetadata.name, sample.genotypeName) : fieldMetadata.name;
                const sourceName = fieldMetadata.sourceName === 'sample' ? AppServerUtils.createSampleName(sample) : fieldMetadata.sourceName;
                const condition = {};
                condition[operator] = value;
                return {
                    columnName,
                    sourceName,
                    condition
                }
            } else {
                return null;
            }
        }
    }
}

module.exports = AppServerFilterUtils;