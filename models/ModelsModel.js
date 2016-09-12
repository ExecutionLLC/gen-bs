'use strict';

const _ = require('lodash');
const async = require('async');

const CollectionUtils = require('../utils/CollectionUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const {ENTITY_TYPES} = require('../utils/Enums');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Model: 'model',
    ModelText: 'model_text'
};

const mappedColumns = [
    'id',
    'originalModelId',
    'rules',
    'type',
    'modelType',
    'analysisType',
    'isDeleted',
    'languId',
    'name',
    'description'
];

class ModelsModel extends SecureModelBase {
    constructor(models) {
        super(models, TableNames.Model, mappedColumns)
    }

    // It collects the latest version of each model for the current user
    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findModels(trx, null, userId, true, true, callback);
        }, callback);
    }

    findMany(userId, modelIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findModels(trx, modelIds, userId, false, false, callback);
        }, callback);
    }

    find(userId, modelId, callback) {
        const modelIds = [modelId];
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findModels(trx, modelIds, userId, false, false, callback),
                (models, callback) => callback(null, _.first(models))
            ], (error, model) => {
                callback(error, model);
            });
        }, callback);
    }

    _add(userId, languId, model, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureNameIsValid(model.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : model.id,
                        creator: userId,
                        rules: model.rules,
                        type: model.type || ENTITY_TYPES.USER,
                        analysisType: model.analysisType,
                        modelType: model.modelType
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (modelId, callback) => {
                    const dataToInsert = {
                        modelId: modelId,
                        languId: languId,
                        name: model.name,
                        description: model.description
                    };
                    this._unsafeInsert(TableNames.ModelText, dataToInsert, trx, (error) => {
                        callback(error, modelId);
                    });
                }
            ], callback);
        }, callback);
    }

    // It creates a new version of an existing model
    _update(userId, model, modelToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        rules: modelToUpdate.rules,
                        type: model.type,
                        analysisType: model.analysisType,
                        modelType: model.modelType,
                        originalModelId: model.originalModelId || model.id
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (modelId, callback) => {
                    const dataToInsert = {
                        modelId: modelId,
                        languId: model.languId,
                        name: modelToUpdate.name,
                        description: modelToUpdate.description
                    };
                    this._unsafeInsert(TableNames.ModelText, dataToInsert, trx, (error) => {
                        callback(error, modelId);
                    });
                }
            ], callback);
        }, callback);
    }

    _fetch(userId, modelId, callback) {
        async.waterfall([
            (callback) => this._fetchModel(modelId, callback),
            (model, callback) => this._checkUserIsCorrect(userId, model, callback)
        ], callback);
    }

    _fetchModel(modelId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin(TableNames.ModelText, `${TableNames.ModelText}.model_id`, `${this.baseTableName}.id`)
                .where('id', modelId)
                .asCallback((error, modelData) => {
                    if (error || !modelData.length) {
                        callback(error || new Error('Item not found: ' + modelId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(modelData[0]));
                    }
                });
        }, callback);
    }

    _findModels(trx, modelIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findModelsMetadata(trx, modelIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (modelsMetadata, callback) => {
                const modelIds = _.map(modelsMetadata, model => model.id);
                callback(null, modelsMetadata, modelIds);
            },
            (models, modelIds, callback) => {
                this._attachModelsDescriptions(trx, models, modelIds, callback);
            }
        ], (error, filters) => {
            callback(error, filters);
        });
    }

    _findModelsMetadata(trx, modelIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        let query = trx.select()
            .from(TableNames.Model)
            .whereRaw('1 = 1');
        if (includeLastVersionsOnly) {
            const selectLastModelIds = 'SELECT' +
                '  T.id' +
                ' FROM (' +
                '  SELECT ROW_NUMBER() OVER (' +
                '    PARTITION BY CASE WHEN original_model_id isnull THEN id' +
                ' ELSE original_model_id END ORDER BY timestamp DESC' +
                '  ) AS RN,' +
                '  id' +
                '  FROM model' +
                ' ) AS T' +
                ' WHERE T.RN = 1';
            query = query.andWhereRaw('model.id IN (' + selectLastModelIds + ')');
        }

        if (userIdOrNull) {
            query = query.andWhere(function () {
                this.whereNull('creator')
                    .orWhere('creator', userIdOrNull);
            });
        } else {
            query = query.andWhere('creator', null);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (modelIdsOrNull) {
            query = query.andWhere('id', 'in', modelIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (models, callback) => this._toCamelCase(models, callback),
            (models, callback) => {
                if (modelIdsOrNull) {
                    this._ensureAllItemsFound(models, modelIdsOrNull, callback);
                } else {
                    callback(null, models);
                }
            }
        ], callback);
    }

    _attachModelsDescriptions(trx, models, modelIds, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(TableNames.ModelText)
                    .whereIn('model_id', modelIds)
                    .asCallback(callback);
            },
            (modelTexts, callback) => this._toCamelCase(modelTexts, callback),
            (modelTexts, callback) => {
                const textsHash = CollectionUtils.createHashByKey(modelTexts, 'modelId');
                const modelsWithDescription = _.map(models, model => {
                    return Object.assign({}, model, {
                        description: textsHash[model.id].description,
                        name: textsHash[model.id].name
                    });
                });
                callback(null, modelsWithDescription);
            }
        ], callback);
    }
}

module.exports = ModelsModel;
