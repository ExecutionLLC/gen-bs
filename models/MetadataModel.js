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
        this._findMetadata(null, null, callback);
    }

    findMany(metadataIds, callback) {
        this._findMetadata(metadataIds, null, callback);
    }

    findEditableMetadata(callback) {
        this._findMetadata(null, true, callback);
    }

    find(metadataId, callback) {
        const metadataIds = [metadataId];
        async.waterfall([
            (callback) => this._findMetadata(metadataIds, null, callback),
            (fields, callback) => callback(null, _.first(fields))
        ], callback);
    }

    _findMetadata(metadataIds, isEditableOrNull, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findMetadataValues(trx, metadataIds, isEditableOrNull, callback),
                (metadataValues, callback) => this._attachAvailableValues(trx, metadataValues, callback)
            ], callback);
        }, callback);
    }

    _attachAvailableValues(trx, metadataValues, callback) {
        const fieldIds = _.map(metadataValues, field => field.id);
        async.waterfall([
            (callback) => this._findAvailableValuesForMetadataIds(trx, fieldIds, callback),
            (availableValues, callback) => {
                const metadataIdsToAvailableValues = _.groupBy(
                    availableValues, availableValue => availableValue.metadataId
                );
                const fieldsWithAvailableValues = _.map(
                    metadataValues,
                    (metadata) => {
                        return Object.assign({}, metadata, {
                            availableValues: metadataIdsToAvailableValues[metadata.id] || []
                        });
                    }
                );
                callback(null, fieldsWithAvailableValues)
            }
        ], callback);

    }

    _findAvailableValuesForMetadataIds(trx, fieldIds, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(TableNames.MetadataAvailableValue)
                .innerJoin(TableNames.MetadataAvailableValueText,
                    `${TableNames.MetadataAvailableValueText}.metadata_available_value_id`,
                    `${TableNames.MetadataAvailableValue}.id`)
                .whereIn('metadata_id', fieldIds)
                .asCallback(callback),
            (valueItems, callback) => this._toCamelCase(valueItems, callback),
            (valueItems, callback) => {
                const availableValuesGroups = _.groupBy(valueItems, item => item.id);
                const availableValues = _.map(availableValuesGroups, groupValues => {
                    const defaultValue = _.first(groupValues);
                    const {id, metadataId} = defaultValue;
                    return {
                        metadataId,
                        id,
                        text: _.map(groupValues, groupValue => {
                            const {languageId, value} = groupValue;
                            return {
                                languageId,
                                value
                            };
                        })
                    };
                });
                callback(null, availableValues);
            }
        ], callback);
    }

    _findMetadataValues(trx, metadataIds, isEditableOrNull, callback) {
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
        if (isEditableOrNull) {
            query = query.andWhere(`${TableNames.Metadata}.is_editable`, isEditableOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (fields, callback) => this._toCamelCase(fields, callback),
            (fields, callback) => {
                const groupedByIdFields = _.groupBy(fields, 'id');
                const resultFields = _.map(groupedByIdFields, group => {
                    const text = _.map(group, field => {
                        const {languageId, label, description} = field;
                        return {
                            languageId,
                            label,
                            description
                        }
                    });
                    const defaultField = _.first(group);
                    const {
                        id, name, isEditable, isInvisible, valueType
                    } = defaultField;
                    return {
                        id,
                        name,
                        isEditable,
                        valueType,
                        isInvisible,
                        text
                    };
                });
                callback(null, resultFields);
            },
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