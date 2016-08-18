'use strict';

const _ = require('lodash');
const AppServerUtils = require('./AppServerUtils');

class AppServerModelUtils {
    static createAppServerModel(filter, fieldIdToMetadata, samples) {
        return AppServerModelUtils._createServerRulesRecursively(filter.rules, fieldIdToMetadata, samples);
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
            // const mappedColumn = _(filterRulesObject)
            //     .keys()
            //     // Ignore fields that don't exist, to be able to apply filters formed on other samples.
            //     .filter(fieldId => fieldIdToMetadata[fieldId])
            //     .map(fieldId => {
            //         if (fieldIdToMetadata[fieldId]){
            //             const field = fieldIdToMetadata[fieldId];
            //             const condition = filterRulesObject[fieldId];
            //             return {
            //                 columnName: field.sourceName ==='sample'?AppServerUtils.createColumnName(field.name, samples[0].genotypeName):field.name,
            //                 sourceName: field.sourceName ==='sample'?AppServerUtils.createSampleName(samples[0]):field.sourceName,
            //                 condition
            //             };
            //         }else {
            //             return null
            //         }
            //
            //     })
            //     .value();
            // if (!mappedColumns.length) {
            //     return null;
            // } else {
            //     return mappedColumns[0];
            // }
        }
    }
}

module.exports = AppServerModelUtils;