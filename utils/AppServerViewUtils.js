'use strict';

const _ = require('lodash');

/**
 * Here is the WS to AS view conversion logic.
 * */
class AppServerViewUtils {
    static createAppServerView(view, fieldIdToMetadata) {
        // Map list items' field ids to pair (field name, source name).
        const listItems = _.map(view.viewListItems, listItem => {
            const field = fieldIdToMetadata[listItem.fieldId];
            return {
                fieldName: field.name,
                sourceName: field.sourceName,
                order: listItem.order,
                sortOrder: listItem.sortOrder,
                sortDirection: listItem.sortDirection
            };
        });
        // Group view items by source name.
        const itemsBySource = _.groupBy(listItems, (listItem) => listItem.sourceName);

        // 'sample' group contains all sample fields.
        const appServerSampleColumns = _.map(itemsBySource['sample'], AppServerViewUtils._createAppServerViewColumn);

        // Other groups except 'sample' are source names.
        const sourceNames = _(itemsBySource)
            .keys()
            .filter(key => key !== 'sample')
            .value();

        // Make groups of columns separately for each source.
        const appServerSources = _.map(sourceNames, sourceName => {
            const sourceColumns = _.map(itemsBySource[sourceName], AppServerViewUtils._createAppServerViewColumn);
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

    static _createAppServerViewColumn(listItem) {
        return {
            name: listItem.fieldName,
            filter: [] // TODO: List of resolved keywords
        };
    }
}

module.exports = AppServerViewUtils;