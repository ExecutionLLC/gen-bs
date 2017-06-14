'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../scripts/utils/FileSystemUtils');
const ChangeCaseUtil = require('../scripts/utils/ChangeCaseUtil.js');

// TODO: Now view builder can be merged with field builder to reduce most of the copy-paste.
class KeywordsBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        this.keywordsTemplates = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.defaultsDir + '/templates/keyword-templates.json')
        );

        this._storeKeywords = this._storeKeywords.bind(this);
        this._createKeyword = this._createKeyword.bind(this);
        this._createSynonyms = this._createSynonyms.bind(this);
        this._createSynonym = this._createSynonym.bind(this);
        this.build = this.build.bind(this);
    }

    build(callback) {
        const fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.fieldMetadataFile)
        );

        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.keywordsDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.keywordsDir, callback);
            },
            (callback) => {
                const keywords = _.map(this.keywordsTemplates, (keyword) => this._createKeyword(keyword, fieldsMetadata));
                this._storeKeywords(keywords, callback);
            }
        ], callback);
    }

    _storeKeywords(keywords, callback) {
        const snakeCasedKeywords = ChangeCaseUtil.convertKeysToSnakeCase(keywords);
        const jsonKeywords = JSON.stringify(snakeCasedKeywords, null, 2);
        FsUtils.writeStringToFile(this.keywordsFile, jsonKeywords, callback);
    }

    _createKeyword(keywordTemplate, fieldsMetadata) {
        const keywordId = Uuid.v4();
        const fieldDescriptor = keywordTemplate.field;
        const field = this._findField(fieldDescriptor.name, fieldDescriptor.sourceName, fieldDescriptor.valueType, fieldsMetadata);
        const synonyms = this._createSynonyms(keywordId, keywordTemplate.synonyms);
        return {
            id: keywordId,
            fieldId: field.id,
            name: keywordTemplate.name,
            value: keywordTemplate.value,
            synonyms: synonyms
        };
    }

    _createSynonyms(keywordId, synonymsTemplate) {
        return _.map(synonymsTemplate, (synonymTemplate) => this._createSynonym(synonymTemplate));
    }

    _createSynonym(synonymTemplate) {
        return {
            languId: synonymTemplate.languId,
            value: synonymTemplate.value
        }
    }
}

module.exports = new KeywordsBuilder();