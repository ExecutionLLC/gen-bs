'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

// TODO: Now view builder can be merged with field builder to reduce most of the copy-paste.
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
     * Builds default views using templates file.
     *
     * The method needs samples field metadata to be present, as it uses field ids to build views.
     * */
    build(callback) {
        const fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.fieldMetadataFile)
        );
        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.viewsDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.viewsDir, callback);
            },
            (callback) => {
                const views = _.map(this.viewTemplates, (view) => this._createView(view, fieldsMetadata));
                this._storeViews(views);
                callback(null);
            }
        ], callback);
    }

    _createListItem(listItemTemplate, fieldsMetadata) {
        const fieldDescriptor = listItemTemplate.field;
        const field = this._findField(fieldDescriptor.name, fieldDescriptor.sourceName, fieldsMetadata);
        if (!field) {
            throw new Error('Field is not found: ' + fieldDescriptor.name + ', source: ' + fieldDescriptor.sourceName);
        }
        return {
            id: Uuid.v4(),
            fieldId: field.id,
            order: listItemTemplate.order,
            sortOrder: listItemTemplate.sortOrder,
            sortDirection: listItemTemplate.sortDirection
        };
    }

    _createView(viewTemplate, fieldsMetadata) {
        return {
            id: Uuid.v4(),
            name: viewTemplate.name,
            viewType: viewTemplate.type,
            description: viewTemplate.description,
            viewListItems: _.map(viewTemplate.items, (listItem) => this._createListItem(listItem, fieldsMetadata))
        };
    }

    _storeViews(views, callback) {
        const snakeCasedViews = ChangeCaseUtil.convertKeysToSnakeCase(views);
        const viewsJson = JSON.stringify(snakeCasedViews, null, 2);
        const viewsFile = this.viewsDir + '/default-views.json';
        FsUtils.writeStringToFile(viewsFile, viewsJson, callback);
    }

    _findField(fieldName, sourceName, fieldsMetadata) {
        const fields = _.filter(fieldsMetadata, fieldMetadata => fieldMetadata.sourceName === sourceName && fieldMetadata.name === fieldName);
        if (fields.length > 1) {
            throw new Error('Too many fields match, name: ' + fieldName + ', source: ' + sourceName);
        } else {
            return fields[0];
        }
    }
}

module.exports = new ViewBuilder();