'use strict';

const _ = require('lodash');
const CollectionUtils = require('./CollectionUtils');
const AppServerUtils = require('./AppServerUtils');

class AppServerSearchInResultUtils {
    static createAppGlobalFilter(globalSearchValue, samples, fieldsMetadata) {
        const excludedColumnNames = AppServerUtils.getSearchKeyFieldsColumnNames();
        const viewExcludedColumnsNames = _.filter(excludedColumnNames, excludedColumnName => {
                return !_.some(fieldsMetadata, fieldMetadata => fieldMetadata.name == excludedColumnName)
            }
        );
        const excludedFields = [];
        _.forEach(viewExcludedColumnsNames, viewExcludedColumnsName => {
            _.forEach(samples, sample => {
                excludedFields.push({
                    columnName: AppServerUtils.createColumnName(viewExcludedColumnsName, sample.genotypeName),
                    sourceName: AppServerUtils.createSampleName(sample)
                });
            })
        });
        // add search key
        excludedFields.push({
            columnName: AppServerUtils.getSearchKeyFieldName(),
            sourceName: ''
        });

        return {
            filter: globalSearchValue,
            excludedFields: excludedFields
        }
    }

    static createAppColumnFilter(fieldSearchValues, samples, fieldsMetadata) {
        return _.map(fieldSearchValues, ({fieldId, value, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const fieldMetadata = _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id === fieldId);
            return {
                columnName: sample ? AppServerUtils.createColumnName(fieldMetadata.name, sample.genotypeName) : fieldMetadata.name,
                sourceName: sample ? AppServerUtils.createSampleName(sample) : fieldMetadata.sourceName,
                columnFilter: value
            }
        })
    }

    static createAppSortOrder(sortParams, samples, fields) {
        const sortedParams = _.sortBy(sortParams, sortParam => sortParam.sortOrder);
        return _.map(sortedParams, ({fieldId, direction, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const field = _.find(fields, field => field.id === fieldId);
            return {
                columnName: sample ? AppServerUtils.createColumnName(field.name, sample.genotypeName): field.name,
                sourceName: sample ? AppServerUtils.createSampleName(sample) : field.sourceName,
                isAscendingOrder: direction === 'asc'
            }
        })
    }
}

module.exports = AppServerSearchInResultUtils;