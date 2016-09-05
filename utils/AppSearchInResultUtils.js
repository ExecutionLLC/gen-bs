'use strict';

const _ = require('lodash');
const CollectionUtils = require('./CollectionUtils');
const AppServerUtils = require('./AppServerUtils');

class AppSearchInResultUtils {

    static getGlobalFilterDuplicatedColumns(searchItem, samples) {
        return _(samples)
            .filter(sample => _.some(sample.values, value => value.fieldId === searchItem.fieldId))
            .map(sample => {
                return {
                    columnName: AppServerUtils.createColumnName(searchItem.name, sample.genotypeName),
                    sourceName: AppServerUtils.createSampleName(sample)
                };
            })
            .value();
    }

    static createAppGlobalFilter(globalSearchValue, excludedFieldIds, samples, fieldsMetadata) {
        const excludedFields = _.map(excludedFieldIds, excludedFieldId => _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id ==excludedFieldId ));
        const noneDuplicatedColumnNames = AppServerUtils.getNoneDuplicatedColumnNames(excludedFields);
        const duplicatedItems = _(excludedFields)
            .filter(excludedField => {
                return !_.some(noneDuplicatedColumnNames, (columnName) => {
                    return columnName === excludedField.name
                })
            })
            .value();

        const duplicatedColumns = [].concat.apply(
            [], _.map(
                duplicatedItems,
                searchItem => AppSearchInResultUtils.getGlobalFilterDuplicatedColumns(searchItem, samples)
            )
        );

        const noneDuplicatedItems = _(excludedFields)
            .filter(excludedField => {
                return _.some(noneDuplicatedColumnNames, (columnName) => {
                    return columnName === excludedField.name
                })
            })
            .value();

        const noneDuplicatedColumns = [].concat.apply(
            [], _.map(
                noneDuplicatedItems,
                searchItem => AppSearchInResultUtils.getGlobalFilterDuplicatedColumns(searchItem, samples)
            )
        );

        const newExcludedFields = [].concat.apply(
            [],
            [
                noneDuplicatedColumns,
                duplicatedColumns
            ]
        );

        return {
            filter: globalSearchValue,
            excludedFields: newExcludedFields
        }
    }

    static createAppColumnFilter(fieldSearchValues, samples, fieldsMetadata) {

        return _.map(fieldSearchValues, ({fieldId, value, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const fieldMetadata = _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id === fieldId);
            return {
                columnName: sample ? AppServerUtils.createColumnName( fieldMetadata.name,sample.genotypeName): fieldMetadata.name,
                sourceName:  sample ? AppServerUtils.createSampleName(sample): fieldMetadata.sourceName,
                columnFilter: value
            }
        })
    }

    static createAppSortOrder(sortParams, samples, fieldsMetadata) {
        const sortedParams = _.sortBy(sortParams, sortParam => sortParam.sortOrder);
        return _.map(sortedParams, ({fieldId, direction, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const fieldMetadata = _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id === fieldId);
            return {
                columnName: AppServerUtils.createColumnName(fieldMetadata.name, sample.genotypeName),
                sourceName: AppServerUtils.createSampleName(sample),
                isAscendingOrder: direction === 'asc'
            }
        })
    }
}

module.exports = AppSearchInResultUtils;