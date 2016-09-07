'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Analysis: 'analysis',
    AnalysisText: 'analysis_text',
    AnalysisSample: 'analysis_sample'
};

const mappedColumns = [
    'id',
    'type',
    'viewId',
    'filterId',
    'modelId',
    'timestamp',
    'lastQueryDate',
    'name',
    'description',
    'languId',
    'sampleVersionId',
    'sampleType',
];

class AnalysisModel extends SecureModelBase {
    constructor(models) {
        super(models, TableNames.Analysis, mappedColumns);
    }

    find(userId, analysisId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findAnalysisById(trx, userId, analysisId, callback)
        }, callback);
    }

    findMany(userId, analysisIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findAnalysisByIds(trx, userId, analysisIds, callback);
        }, callback);
    }

    findAll(userId, limit, offset, nameFilter, descriptionFilter, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    this._findAnalysisIds(
                        trx,
                        userId,
                        limit,
                        offset,
                        nameFilter,
                        descriptionFilter,
                        (error, result) => {
                            callback(error, result)
                        }
                    );
                },
                (analysisIds, callback) => {
                    this._findAnalysisByIds(trx, userId, analysisIds,
                        (error, result) => {
                            callback(error, result)
                        }
                    )
                }
            ], callback);
        }, callback);
    }

    _update(userId, analysis, analysisToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            this._updateInTransaction(analysis.id, analysisToUpdate, trx, callback);
        }, callback);
    }

    _updateInTransaction(analysisId, analysisToUpdate, trx, callback) {
        const {name, description, languId, lastQueryDate} = analysisToUpdate;
        async.waterfall(
            [
                (callback) => {
                    const updateAnalysisData = {
                        lastQueryDate
                    };
                    this._unsafeUpdate(
                        analysisId,
                        updateAnalysisData,
                        trx,
                        (error) => {
                            callback(error, analysisId)
                        }
                    )
                },
                (analysisId, callback) => {
                    const updateAnalysisTextData = {
                        name,
                        description
                    };
                    this._unsafeTextDataUpdate(
                        analysisId,
                        languId,
                        updateAnalysisTextData,
                        trx,
                        (error) => {
                            callback(error, analysisId)
                        }
                    )
                }
            ],
            callback
        );
    }

    _unsafeTextDataUpdate(analysisId, languageId, updateAnalysisTextData, trx, callback) {
        trx(TableNames.AnalysisText)
            .where('analysis_id', analysisId)
            .andWhere('langu_id', languageId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(updateAnalysisTextData))
            .asCallback(
                (error) => callback(error, analysisId)
            );
    }

    add(userId, languId, item, callback) {
        async.waterfall([
            (callback) => this._add(userId, languId, item, true, callback),
            (itemId, callback) => this.find(userId, itemId, callback)
        ], callback);
    }

    _add(userId, languageId, analysis, shouldGenerateId, callback) {
        this.db.transactionally(
            (trx, callback) => {
                this._addInTransaction(
                    userId, languageId, analysis, shouldGenerateId, trx, callback
                );
            },
            callback
        );
    }

    _addInTransaction(userId, languId, analysis, shouldGenerateId, trx, callback) {
        const {
            name, description, samples
        } = analysis;
        async.waterfall([
                (callback) => {
                    const {
                        id, viewId, filterId, modelId, type
                    } = analysis;
                    const analysisDataToInsert =  {
                        id: shouldGenerateId ? this._generateId() : id,
                        creator: userId,
                        viewId,
                        filterId,
                        modelId,
                        type,
                        lastQueryDate: new Date()
                    };
                    this._insert(analysisDataToInsert, trx, callback);
                },
                (analysisId, callback) => {
                    const analysisTextDataToInsert = {
                        analysisId: analysisId,
                        languId,
                        name,
                        description
                    };
                    this._unsafeInsert(
                        TableNames.AnalysisText,
                        analysisTextDataToInsert,
                        trx,
                        (error) => {
                            callback(error, analysisId)
                        }
                    );
                },
                (analysisId, callback) => {
                    _.forEach(samples, (sample, index) => {
                            this._addNewAnalysisSample(
                                analysisId, sample, index, trx, callback
                            );
                        }
                    );
                    callback(null, analysisId);
                },
            ], callback
        );
    }

    _addNewAnalysisSample(analysisId, sample, order, trx, callback) {
        const {id, type} = sample;
        const analysisSampleDataToInsert = {
            analysisId,
            genotypeVersionId: id,
            sampleType: type,
            order
        };
        this._unsafeInsert(
            TableNames.AnalysisSample, analysisSampleDataToInsert, trx, callback
        );
    }

    _findAnalysisIds(trx, userId, limit, offset, nameFilter, descriptionFilter, callback) {

        trx.select('id', 'timestamp')
            .from(this.baseTableName)
            .innerJoin(
                TableNames.AnalysisText,
                `${TableNames.AnalysisText}.analysis_id`,
                `${this.baseTableName}.id`
            )
            .where('creator', userId)
            .andWhere(function () {
                this.where(
                    trx.raw('LOWER("name") like ?', `%${nameFilter.toLowerCase()}%`)
                )
                    .orWhere(
                        trx.raw('LOWER("description") like ?', `%${descriptionFilter.toLowerCase()}%`)
                    )
            })
            .orderBy('timestamp', 'desc')
            .offset(offset)
            .limit(limit)
            .asCallback(
                (error, result) => {
                    callback(error, _.map(result, resultItem => resultItem.id));
                }
            );
    }

    _findAnalysisByIds(trx, userId, analysisIds, callback) {
        trx.select()
            .from(this.baseTableName)
            .innerJoin(
                TableNames.AnalysisText,
                `${TableNames.AnalysisText}.analysis_id`,
                `${this.baseTableName}.id`
            )
            .innerJoin(
                TableNames.AnalysisSample,
                `${TableNames.AnalysisSample}.analysis_id`,
                `${this.baseTableName}.id`
            )
            .whereIn('id', analysisIds)
            .andWhere('creator', userId)
            .orderBy('timestamp', 'desc')
            .asCallback(
                (error, result) => async.waterfall([
                    (callback) => this._parseAnalysesResult(result, callback),
                    (analyses, callback) => {
                        this._ensureAllItemsFound(analyses, analysisIds, callback);
                    }
                ], callback)
            );
    }

    _findAnalysisById(trx ,userId, analysisId, callback) {
        async.waterfall([
            (callback) =>  this._findAnalysisByIds( trx, userId, [analysisId], callback),
            (analyses, callback) => {
                if (analyses && analyses.length) {
                    callback(null, analyses[0])
                } else {
                    callback(
                        new Error(
                            `Analysis item is not found ${analysisId}`
                        )
                    )
                }
            }
        ], callback);
    }

    _parseAnalysesResult(result, callback) {
        const analyses = _.map(
            _.groupBy(result, 'id'),
            this._prepareAnalysis
        );
        callback(null, analyses)
    }

    _prepareAnalysis(analysisSampleGroup) {
        const camelcaseAnalysis = ChangeCaseUtil.convertKeysToCamelCase(
            analysisSampleGroup
        );
        const {
            id,
            name,
            description,
            filterId,
            viewId,
            modelId,
            timestamp,
            lastQueryDate,
            type,
            languId
        } = camelcaseAnalysis[0];

        const sortedAnalyses = _.orderBy(camelcaseAnalysis, ['order'], ['asc']);
        const samples = _.map(
            sortedAnalyses,
            (sortedAnalysis) => {
                return {
                    id: sortedAnalysis.genotypeVersionId,
                    type: sortedAnalysis.sampleType
                }
            }
        );

        return {
            id,
            name,
            description,
            filterId,
            viewId,
            modelId,
            createdDate: timestamp,
            lastQueryDate,
            type,
            samples,
            languId
        }
    }
}

module.exports = AnalysisModel;