'use strict';

const _ = require('lodash');
const CollectionUtils = require('./CollectionUtils');
const AppServerUtils = require('./AppServerUtils');

/**
 * Here is the WS to AS view conversion logic.
 * */
class AppServerViewUtils {

    static createAppServerColumnName(fieldName, sourceName, genotypeName, shouldPrefixSources) {
        // Prefix source fields with the source name.
        if (sourceName !== 'sample' && shouldPrefixSources) {
            return `${sourceName}_${fieldName}`;
        }
        // Postfix genotype fields with genotype name.
        if (fieldName.startsWith(AppServerUtils.getGenotypeFieldsPrefix())) {
            return `${fieldName}_${genotypeName}`;
        }
        return fieldName;
    }

    static getDuplicatedSampleColumns(sampleItem, samples) {
        return _(samples)
            .filter(sample => _.some(sample.sampleFields, value => value.fieldId === sampleItem.fieldId))
            .map(sample => {
                return {
                    columnName: AppServerUtils.createColumnName(sampleItem.fieldName, sample.genotypeName),
                    sourceName: AppServerUtils.createSampleName(sample),
                    filter: sampleItem.filter
                };
            })
            .value();
    }

    static createAppServerView(view, fieldIdToMetadata, samples) {
        const viewListItems = view.viewListItems;
        const searchKeyFieldNames = AppServerUtils.getSearchKeyFieldsColumnNames();
        const searchKeyFields = _.filter(fieldIdToMetadata, field => _.includes(searchKeyFieldNames, field.name));
        const missingSearchFieldsListItems = _(searchKeyFields)
            .filter(mandatoryField => !_.some(viewListItems, listItem => listItem.fieldId === mandatoryField.id))
            .map(field => {
                return {
                    fieldId: field.id,
                    sourceName: field.sourceName
                };
            })
            .value();
        const allListItems = view.viewListItems.concat(missingSearchFieldsListItems);
        // Map list items' field ids to pair (field name, source name).
        const listItems = _(allListItems)
        // Ignore missing fields, to be able to apply views generated for a different sample, with unique fields.
            .filter(listItem => fieldIdToMetadata[listItem.fieldId])
            .map(listItem => {
                const field = fieldIdToMetadata[listItem.fieldId];
                const keyWordHash = CollectionUtils.createHashByKey(field.keywords, 'id');
                return {
                    fieldId: field.id,
                    fieldName: field.name,
                    sourceName: field.sourceName,
                    filter: _.map(listItem.keywords, keywordId => keyWordHash[keywordId].value)
                };
            })
            .value();
        const noneDuplicatedColumnNames = AppServerUtils.getNotDuplicatedColumnNames(fieldIdToMetadata);
        const sampleDuplicatedItems = _(listItems)
            .filter(listItem => {
                return listItem.sourceName === 'sample' && !_.some(noneDuplicatedColumnNames, (columnName) => {
                        return columnName === listItem.fieldName
                    })
            })
            .value();
        const appServerSampleDuplicatedColumns = [].concat.apply(
            [], _.map(sampleDuplicatedItems, sampleItem => AppServerViewUtils.getDuplicatedSampleColumns(sampleItem, samples))
        );

        const sampleNoneDuplicatedItems = _(listItems)
            .filter(listItem => {
                return listItem.sourceName === 'sample' &&
                    _.some(noneDuplicatedColumnNames, (columnName) => {
                        return columnName === listItem.fieldName
                    })
            })
            .value();
        const appServerSampleNoneDuplicatedColumns = _.map(
            sampleNoneDuplicatedItems, sampleItem => {
                return {
                    columnName: AppServerUtils.createColumnName(sampleItem.fieldName, samples[0].genotypeName),
                    sourceName: AppServerUtils.createSampleName(samples[0]),
                    filter: sampleItem.filter
                }
            });

        const sourceItems = _(listItems)
            .filter(listItem => listItem.sourceName !== 'sample')
            .value();
        const appServerSampleSourceColumns = _.map(
            sourceItems, sourceItem => {
                return {
                    columnName: AppServerUtils.createColumnName(sourceItem.fieldName, null),
                    sourceName: sourceItem.sourceName,
                    filter: sourceItem.filter
                }
            });
        return [].concat.apply(
            [],
            [
                appServerSampleDuplicatedColumns,
                appServerSampleNoneDuplicatedColumns,
                appServerSampleSourceColumns
            ]
        );
    }
}

module.exports = AppServerViewUtils;