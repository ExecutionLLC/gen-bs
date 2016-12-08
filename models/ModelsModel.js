'use strict';

const _ = require('lodash');
const async = require('async');

const CollectionUtils = require('../utils/CollectionUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const {ENTITY_TYPES} = require('../utils/Enums');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Model: 'model',
    ModelText: 'model_text',
    ModelVersion: 'model_version'
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
                        id: this._generateId(),
                        creator: userId,
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
                },
                (modelId, callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : model.id,
                        modelId: modelId,
                        rules: model.rules
                    };
                    this._unsafeInsert(TableNames.ModelVersion, dataToInsert, trx, callback);
                }
            ], callback);
        }, callback);
    }

    // It creates a new version of an existing model
    _update(userId, model, modelToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            const dataToInsert = {
                id: this._generateId(),
                modelId: modelToUpdate.modelId,
                rules: modelToUpdate.rules
            };
            this._unsafeInsert(TableNames.ModelVersion, dataToInsert, trx, callback);
        }, callback);
    }

    _fetch(userId, modelId, callback) {
        async.waterfall([
            (callback) => this._fetchModel(userId,modelId, callback),
            (model, callback) => this._checkUserIsCorrect(userId, model, callback)
        ], callback);
    }

    _fetchModel(userId, modelId, callback) {
        this.db.asCallback((trx, callback) => {
            async.waterfall([
                (callback) => this._findModels(trx, [modelId], userId, false, false, callback),
                (models) => {
                    if (!models.length) {
                        callback(new Error('Item not found: ' + modelId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(models[0]));
                    }
                }
            ], callback);
        }, callback);
    }

    _findModels(trx, modelIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findModelsMetadata(trx, modelIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (modelsMetadata, callback) => {
                const modelIds = _.map(modelsMetadata, model => model.modelId);
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
        let query = trx.select([
            `${TableNames.ModelVersion}.id`,
            `${TableNames.ModelVersion}.rules`,
            `${TableNames.ModelVersion}.created`,
            `${TableNames.ModelVersion}.model_id`,
            `${TableNames.Model}.type`,
            `${TableNames.Model}.analysis_type`,
            `${TableNames.Model}.model_type`,
            `${TableNames.Model}.is_deleted`,
            `${TableNames.Model}.creator`
        ])
            .from(TableNames.ModelVersion)
            .leftJoin(TableNames.Model,`${TableNames.ModelVersion}.model_id`,`${TableNames.Model}.id`)
            .whereRaw('1 = 1');

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
            query = query.andWhere(`${TableNames.ModelVersion}.id`, 'in', modelIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (models, callback) => this._toCamelCase(models, callback),
            (models, callback) => {
                if (includeLastVersionsOnly) {
                    this._getLastModelVersions(models, callback);
                } else {
                    callback(null, models)
                }
            },
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
                        description: textsHash[model.modelId].description,
                        name: textsHash[model.modelId].name
                    });
                });
                callback(null, modelsWithDescription);
            }
        ], callback);
    }

    _getLastModelVersions(models, callback) {
        const modelVersionGroup = _.groupBy(models, 'modelId');
        const lastVersions = _.map(modelVersionGroup, modelGroup => {
            const orderedModels = _.orderBy(modelGroup, ['created'], ['desc']);
            return _.head(orderedModels);
        });
        callback(null, lastVersions)
    }

    remove(userId, itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => this._remove(itemData.modelId, callback)
        ], callback);
    }

    _remove(itemId, callback) {
        this.db.transactionally((trx, callback) => {
            trx(TableNames.Model)
                .where('id', itemId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({isDeleted: true}))
                .asCallback((error) => {
                    callback(error, itemId);
                });
        }, callback);
    }
}

module.exports = ModelsModel;
