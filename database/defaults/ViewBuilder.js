'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../scripts/utils/FileSystemUtils');
const ChangeCaseUtil = require('../scripts/utils/ChangeCaseUtil');

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
        this._createKeywords = this._createKeywords.bind(this);
        this._findKeywordId = this._findKeywordId.bind(this);
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
        const keywords = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.keywordsFile)
        );

        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.viewsDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.viewsDir, callback);
            },
            (callback) => {
                const views = _.map(this.viewTemplates, (view) => this._createView(view, fieldsMetadata, keywords));
                this._storeViews(views);
                callback(null);
            }
        ], callback);
    }

    _createView(viewTemplate, fieldsMetadata, keywords) {
        return {
            id: Uuid.v4(),
            name: viewTemplate.name,
            type: viewTemplate.type,
            description: viewTemplate.description,
            viewListItems: _.map(viewTemplate.items, (listItem) => this._createListItem(listItem, fieldsMetadata, keywords))
        };
    }

    _createListItem(listItemTemplate, fieldsMetadata, keywords) {
        const fieldDescriptor = listItemTemplate.field;
        const field = this._findField(fieldDescriptor.name, fieldDescriptor.sourceName, fieldDescriptor.valueType, fieldsMetadata);
        if (!field) {
            throw new Error('Field is not found: ' + fieldDescriptor.name + ', source: ' + fieldDescriptor.sourceName + ', type: ' + fieldDescriptor.valueType);
        }
        return {
            id: Uuid.v4(),
            fieldId: field.id,
            order: listItemTemplate.order,
            sortOrder: listItemTemplate.sortOrder,
            sortDirection: listItemTemplate.sortDirection,
            keywords: this._createKeywords(listItemTemplate.keywords, keywords)
        };
    }

    _createKeywords(keywordsNames, keywords) {
        return _.map(keywordsNames, (keywordName) => this._findKeywordId(keywordName, keywords));
    }

    _findKeywordId(keywordName, keywords) {
        const keywordsFound = _.filter(keywords, keyword => keyword.name === keywordName);
        if (keywordsFound.length !== 1) {
            throw new Error('Incorrect number of keywords found for name: ' + keywordName);
        } else {
            return keywordsFound[0].id;
        }
    }

    _storeViews(views, callback) {
        const snakeCasedViews = ChangeCaseUtil.convertKeysToSnakeCase(views);
        const viewsJson = JSON.stringify(snakeCasedViews, null, 2);
        const viewsFile = this.viewsDir + '/default-views.json';
        FsUtils.writeStringToFile(viewsFile, viewsJson, callback);
    }
}

module.exports = new ViewBuilder();