'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const ModelBase = require('./ModelBase');

const TableNames = {
    Metadata: 'metadata',
    MetadataText: 'metadata_text',
    MetadataAvailableValue: 'metadata_available_value',
    MetadataAvailableValueText: 'metadata_available_value_text'
};

class MetadataModel extends ModelBase {
    constructor(models) {
        super(models, TableNames.Metadata);
    }

    findAll(callback) {
        this._findMetadata(null, null, null, callback);
    }

    findMany(metadataIds, callback) {
        this._findMetadata(metadataIds, null, null, callback);
    }

    findEditableMetadata(callback) {
        this._findMetadata(null, null, true, callback);
    }

    find(metadataId, callback) {
        const metadataIds = [metadataId];
        async.waterfall([
            (callback) => this._findMetadata(metadataIds, null, null, callback),
            (fields, callback) => callback(null, _.first(fields))
        ], callback);
    }

    _findMetadata(metadataIds, languageIdOrNull, isEditableOrNull, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findMetadataValues(trx, metadataIds, languageIdOrNull, isEditableOrNull, callback),
                (metadataValues, callback) => this._attachAvailableValues(metadataValues, languageIdOrNull, callback)
            ], callback);
        }, callback);
    }

    _attachAvailableValues(metadataValues, languageIdOrNull, callback) {
        const fieldIds = _.map(metadataValues, field => field.id);
        async.waterfall([
            (callback) => this._findAvailableValuesForMetadataIds(fieldIds, languageIdOrNull, callback),
            (availableValues, callback) => {
                const metadataIdsToAvailableValues = _.groupBy(
                    availableValues, availableValue => availableValue.metadataId
                );
                const fieldsWithAvailableValues = _.map(
                    metadataValues,
                    (metadata) => {
                        return Object.assign({}, metadata,{
                            availableValues: metadataIdsToAvailableValues[metadata.id] || []
                        });
                    }
                );
                callback(null, fieldsWithAvailableValues)
            }
        ], callback);

    }

    _findAvailableValuesForMetadataIds(fieldIds, languageIdOrNull, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(TableNames.MetadataAvailableValue)
                .innerJoin(TableNames.MetadataAvailableValueText,
                    `${TableNames.MetadataAvailableValueText}.metadata_available_value_id`,
                    `${TableNames.MetadataAvailableValue}.id`)
                .whereIn('metadata_id', fieldIds)
                .andWhere('language_id', languageIdOrNull || this.models.config.defaultLanguId)
                .asCallback((error, fieldAvailableValues) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fieldAvailableValues));
                    }
                });
        }, callback);
    }

    _findMetadataValues(trx, metadataIds, languageIdOrNull, isEditableOrNull, callback) {
        let query = trx.select([
            `${TableNames.Metadata}.id`,
            `${TableNames.Metadata}.name`,
            `${TableNames.Metadata}.value_type`,
            `${TableNames.Metadata}.is_editable`,
            `${TableNames.Metadata}.is_invisible`,
            `${TableNames.MetadataText}.label`,
            `${TableNames.MetadataText}.description`
        ])
            .from(TableNames.Metadata)
            .leftJoin(TableNames.MetadataText, `${TableNames.MetadataText}.metadata_id`, `${TableNames.Metadata}.id`)
            .whereRaw('1 = 1');
        if (metadataIds) {
            query = query.andWhere(`${TableNames.Metadata}.id`, 'in', metadataIds);
        }
        query = query.andWhere(`${TableNames.MetadataText}.language_id`, languageIdOrNull || this.models.config.defaultLanguId);

        if (isEditableOrNull) {
            query = query.andWhere(`${TableNames.Metadata}.is_editable`, isEditableOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (fields, callback) => this._toCamelCase(fields, callback),
            (fields, callback) => {
                if (metadataIds) {
                    this._ensureAllItemsFound(fields, metadataIds, callback);
                } else {
                    callback(null, fields);
                }
            }
        ], callback);
    }
}

module.exports = MetadataModel;