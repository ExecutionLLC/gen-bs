'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class ViewBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        this.viewTemplates = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.defaultsDir + '/templates/view-templates.json')
        );
        this.build = this.build.bind(this);
        this._createView = this._createView.bind(this);
        this._createListItem = this._createListItem.bind(this);
    }

    /**
     * Gets field id from the generated source metadata.
     * */
    _getFieldId(sourceName, fieldName) {
        const sourceFilePath = this._getMetadataFilePath(sourceName);
        const sourceContents = FsUtils.getFileContentsAsString(sourceFilePath);
        const sourceMetadata = JSON.parse(sourceContents);
        const fieldMetadata = sourceMetadata.fields;
        const field = _.find(fieldMetadata, field => field.name === fieldName);
        if (!field) {
            throw new Error('Field is not found! Source name: %s, field name: %s', sourceName, fieldName);
        }
        return field.id;
    }

    _createListItem(listItemTemplate) {
        const fieldDescriptor = listItemTemplate.field;
        return {
            id: Uuid.v4(),
            fieldName: fieldDescriptor.name,
            sourceName: fieldDescriptor.sourceName,
            order: listItemTemplate.order,
            sortOrder: listItemTemplate.sortOrder,
            sortDirection: listItemTemplate.sortDirection
        };
    }

    _createView(viewTemplate) {
        return {
            id: Uuid.v4(),
            name: viewTemplate.name,
            viewType: viewTemplate.type,
            description: viewTemplate.description,
            viewListItems: _.map(viewTemplate.items, this._createListItem)
        };
    }

    _storeViews(views, callback) {
        const snakeCasedViews = ChangeCaseUtil.convertKeysToSnakeCase(views);
        const viewsJson = JSON.stringify(snakeCasedViews, null, 2);
        const viewsFile = this.viewsDir + '/default-views.json';
        FsUtils.writeStringToFile(viewsFile, viewsJson, callback);
    }

    /**
     * Builds default views using templates file.
     *
     * The method needs samples field metadata to be present, as it uses field ids to build views.
     * */
    build(callback) {
        FsUtils.createDirectoryIfNotExists(this.viewsDir, (error) => {
           if (error) {
               callback(error);
           } else {
               this._removeJsonFilesFromDirectory(this.viewsDir, (error) => {
                   if (error) {
                       callback(error);
                   } else {
                       const views = _.map(this.viewTemplates, this._createView);
                       this._storeViews(views);
                       callback(null);
                   }
               });
           }
        });
    }
}

module.exports = new ViewBuilder();