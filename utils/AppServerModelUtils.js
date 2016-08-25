'use strict';

const _ = require('lodash');
const AppServerUtils = require('./AppServerUtils');

class AppServerModelUtils {
    static createAppServerModel(model, fieldIdToMetadata, samples) {
        if (_.isNull(model)){
            return null
        }
        return AppServerModelUtils._createServerRulesRecursively(model.rules, fieldIdToMetadata, samples);
    }

    static _createServerRulesRecursively(filterRulesObject, fieldIdToMetadata, samples) {
        const operator = filterRulesObject['condition'] || null;
        if (operator) {
            const operands = filterRulesObject['rules'];
            const mappedOperands = _(operands)
                .map((operand) => AppServerModelUtils._createServerRulesRecursively(operand, fieldIdToMetadata, samples))
                .filter(operand => operand)
                .value();
            if (_.isEmpty(mappedOperands)) {
                return null;
            }
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            const {field, sampleType, operator,value} = filterRulesObject;
            const fieldMetadata = fieldIdToMetadata[field];
            if(fieldMetadata){
                const sample = _.find(samples, sample => sample.sampleType === sampleType);
                if (sample){
                    const columnName = fieldMetadata.sourceName ==='sample'?AppServerUtils.createColumnName(fieldMetadata.name, sample.genotypeName):fieldMetadata.name;
                    const sourceName = fieldMetadata.sourceName ==='sample'?AppServerUtils.createSampleName(samples[0]):fieldMetadata.sourceName;
                    const condition = {};
                    condition[operator] = value;
                    return{
                        columnName,
                        sourceName,
                        condition,
                    }
                }else {
                    return null
                }
            }else {
                return null;
            }
        }
    }
}

module.exports = AppServerModelUtils;