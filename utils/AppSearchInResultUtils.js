'use strict';

const _ = require('lodash');
const CollectionUtils = require('./CollectionUtils');
const AppServerUtils = require('./AppServerUtils');

class AppSearchInResultUtils{

    static getGlobalFilterDuplicatedColumns(searchItem, samples){
        return _(samples)
            .filter(sample => _.some(sample.values,value => value.fieldId === searchItem.fieldId))
            .map(sample =>{
                return {
                    columnName: AppServerUtils.createColumnName(searchItem.fieldName, sample.genotypeName),
                    sourceName: AppServerUtils.createSampleName(sample)
                };
            })
            .value();
    }

    static createAppGlobalFilter(globalSearchValue, excludedFieldIds, samples, fieldsMetadata){
        const excludedFields = _.map(excludedFieldIds,excludedFieldId => fieldsMetadata[excludedFieldId]);
        const noneDuplicatedColumnNames = AppServerUtils.getNoneDuplicatedColumnNames(excludedFields);
        const duplicatedItems = _(excludedFields)
            .filter(excludedField => {
                return !_.some(noneDuplicatedColumnNames, (columnName) => {
                    return columnName ===excludedField.fieldName
                })
            })
            .value();

        const duplicatedColumns = [].concat.apply(
            [],_.map(
                duplicatedItems,
                searchItem => AppSearchInResultUtils.getGlobalFilterDuplicatedColumns(searchItem, samples)
            )
        );

        const noneDuplicatedItems = _(excludedFields)
            .filter(excludedField => {
                return _.some(noneDuplicatedColumnNames, (columnName) => {
                    return columnName ===excludedField.fieldName
                })
            })
            .value();

        const noneDuplicatedColumns = [].concat.apply(
            [],_.map(
                noneDuplicatedItems,
                searchItem => AppSearchInResultUtils.getGlobalFilterDuplicatedColumns(searchItem, samples)
            )
        );

        const excludedFields = [].concat.apply(
            [],
            [
                noneDuplicatedColumns,
                duplicatedColumns
            ]
        );

        return {
            filter: globalSearchValue,
            excludedFields: excludedFields
        }
    }

    static createAppColumnFilter(fieldSearchValues, samples, fieldsMetadata){

        return _.map(fieldSearchValues,({fieldId, value, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const fieldMetadata = _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id===fieldId);
            return {
                columnName: AppServerUtils.createColumnName(fieldMetadata.fieldName, sample.genotypeName),
                sourceName: AppServerUtils.createSampleName(sample),
                columnFilter: value
            }
        })
    }

    static createAppSortOrder(sortParams, samples,fieldsMetadata){
        const sortedParams = _.sortBy(sortParams, sortParam => sortParam.sortOrder);
        return _.map(fieldSearchValues,({fieldId, value, sampleId}) => {
            const sample = _.find(samples, sample => sample.id === sampleId);
            const fieldMetadata = _.find(fieldsMetadata, fieldMetadata => fieldMetadata.id===fieldId);
            return {
                columnName: AppServerUtils.createColumnName(fieldMetadata.fieldName, sample.genotypeName),
                sourceName: AppServerUtils.createSampleName(sample),
                columnFilter: value
            }
        })
    }
}

module.exports = AppSearchInResultUtils;