'use strict';

const _ = require('lodash');
const CollectionUtils = require('./CollectionUtils');

/**
 * Here is the WS to AS view conversion logic.
 * */
class AppServerViewUtils {
    static getGenotypeFieldsPrefix() {
        return 'GT_';
    }

    static createAppServerColumnName(fieldName, sourceName, genotypeName, shouldPrefixSources) {
        // Prefix source fields with the source name.
        if (sourceName !== 'sample' && shouldPrefixSources) {
            return `${sourceName}_${fieldName}`;
        }
        // Postfix genotype fields with genotype name.
        if (fieldName.startsWith(AppServerViewUtils.getGenotypeFieldsPrefix())) {
            return `${fieldName}_${genotypeName}`;
        }
        return fieldName;
    }

    static createAppServerView(view, fieldIdToMetadata, sampleGenotypeName) {
        const viewListItems = view.viewListItems;

        // Mandatory fields should always be in the results (ex. for comments).
        const mandatoryFields = _.filter(fieldIdToMetadata, field => field.isMandatory);
        const missingMandatoryFieldsListItems = _(mandatoryFields)
            .filter(mandatoryField => !_.some(viewListItems, listItem => listItem.fieldId === mandatoryField.id))
            .map(field => {
                return {
                    fieldId: field.id,
                    sourceName: field.sourceName
                };
            })
            .value();

        const allListItems = view.viewListItems.concat(missingMandatoryFieldsListItems);

        // Map list items' field ids to pair (field name, source name).
        const listItems = _(allListItems)
        // Ignore missing fields, to be able to apply views generated for a different sample, with unique fields.
            .filter(listItem => fieldIdToMetadata[listItem.fieldId])
            .map(listItem => {
                const field = fieldIdToMetadata[listItem.fieldId];
                const keyWordHash = CollectionUtils.createHashByKey(field.keywords, 'id');
                return {
                    fieldName: field.name,
                    sourceName: field.sourceName,
                    order: listItem.order,
                    sortOrder: listItem.sortOrder,
                    sortDirection: listItem.sortDirection,
                    filter: _.map(listItem.keywords, keywordId =>keyWordHash[keywordId].value)
                };
            })
            .value();
        // Group view items by source name.
        const itemsBySource = _.groupBy(listItems, (listItem) => listItem.sourceName);

        // 'sample' group contains all sample fields.
        const appServerSampleColumns = _.map(itemsBySource['sample'],
            ({fieldName, filter}) => ({
                name: AppServerViewUtils.createAppServerColumnName(fieldName,
                    'sample', sampleGenotypeName, false),
                filter
            }));

        // Other groups except 'sample' are source names.
        const sourceNames = _(itemsBySource)
            .keys()
            .filter(key => key !== 'sample')
            .value();

        // Make groups of columns separately for each source.
        const appServerSources = _.map(sourceNames, sourceName => {
            const sourceColumns = _.map(itemsBySource[sourceName], ({fieldName, filter}) => ({
                name: AppServerViewUtils.createAppServerColumnName(fieldName, null, null, false),
                filter
            }));
            return {
                name: sourceName,
                columns: sourceColumns
            };
        });

        return {
            sampleColumns: appServerSampleColumns,
            sources: appServerSources
        };
    }
}

module.exports = AppServerViewUtils;