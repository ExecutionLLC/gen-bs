'use strict';

const _ = require('lodash');
const AppServerUtils = require('./AppServerUtils');
const CollectionUtils = require('./CollectionUtils');
const {MODEL_TYPES} = require('./Enums.js');

class AppServerModelUtils {
    static createAppServerModel(model, fieldIdToMetadata, samples) {
        if (_.isNull(model) || _.isNull(model.rules)) {
            return null;
        }
        const samplesInfo = _.map(samples, sample => {
            const sampleFields = _.map(sample.sampleFields, value => fieldIdToMetadata[value.fieldId]);
            const sampleFieldHash = CollectionUtils.createHash(sampleFields, fieldMetadata => fieldMetadata.id);
            return {
                sampleFieldHash,
                sample,
                sampleType: sample.sampleType
            }
        });
        const sampleInfoHash = CollectionUtils.createHash(samplesInfo, sampleInfo => sampleInfo.sampleType);
        const rules = model.modelType == MODEL_TYPES.COMPLEX ? model.rules : AppServerModelUtils._createServerRulesRecursively(model.rules, sampleInfoHash, samples);
        return {
            type: model.modelType,
            rules
        };
    }

    static _createServerRulesRecursively(filterRulesObject, sampleInfoHash, samples) {
        const operator = filterRulesObject.condition || null;
        if (operator) {
            const operands = filterRulesObject.rules;
            const mappedOperands = _(operands)
                .map((operand) => AppServerModelUtils._createServerRulesRecursively(operand, sampleInfoHash, samples))
                .filter(operand => operand)
                .value();
            if (_.isEmpty(mappedOperands)) {
                return null;
            }
            return {
                [operator]: mappedOperands
            };
        } else {
            const {field, sampleType, operator, value} = filterRulesObject;
            const sampleInfo = sampleInfoHash[sampleType];
            if (sampleInfo) {
                const fieldMetadata = sampleInfo.sampleFieldHash[field];
                if (fieldMetadata) {
                    const columnName = fieldMetadata.sourceName === 'sample' ? AppServerUtils.createColumnName(fieldMetadata.name, sampleInfo.sample.genotypeName) : fieldMetadata.name;
                    const sourceName = fieldMetadata.sourceName === 'sample' ? AppServerUtils.createSampleName(sampleInfo.sample) : fieldMetadata.sourceName;
                    const condition = {};
                    condition[operator] = value;
                    return {
                        columnName,
                        sourceName,
                        condition,
                    };
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
    }
}

module.exports = AppServerModelUtils;