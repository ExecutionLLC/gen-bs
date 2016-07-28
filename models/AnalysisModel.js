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

    find(userId,analysisId, callback){
        this._findAnalysisById(userId, analysisId, callback)
    }

    findAll(userId, limit, offset, nameFilter, descriptionFilter, callback ){
        this._findAnalysis(
            userId,
            limit,
            offset,
            nameFilter,
            descriptionFilter,
            callback
        );
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
                        (error) =>{
                            callback(error, null)
                        }
                    )
                },
                (callback) => {
                    const updateAnalysisTextData = {
                        name,
                        description
                    };
                    this._unsafeTextDataUpdate(
                        analysisId,
                        languId,
                        updateAnalysisTextData,
                        trx,
                        (error) =>{
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
            .where('analysisId',analysisId)
            .andWhere('languId', languageId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(updateAnalysisTextData))
            .asCallback(
                (error) => callback(error, analysisId)
            );
    }

    _add(userId, languageId, analysis, shouldGenerateId, callback) {
        this.db.transactionally(
            (trx, callback) => {
                this._addInTransaction(
                    userId, analysis, shouldGenerateId, trx, callback
                );
            },
            callback
        );
    }

    _addInTransaction(userId, analysis, shouldGenerateId, trx, callback) {
        const {
            languId, name, description, samples
        } = analysis;
        async.waterfall(
            [
                (callback) => {
                    const analysisDataToInsert = this._createDataToInsert(
                        userId, analysis, shouldGenerateId
                    );
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
            ],
            callback
        );
    }

    _addNewAnalysisSample(analysisId, sample, order, trx, callback) {
        const {id, type} = sample;
        const analysisSampleDataToInsert ={
            analysisId,
            sampleVersionId:id,
            sampleType:type,
            order
        };
        this._unsafeInsert(
            TableNames.AnalysisSample, analysisSampleDataToInsert, trx, callback
        );
    }

    _createDataToInsert(userId, analysis, shouldGenerateId) {
        const {
            id, viewId, filterId, modelId
        } = analysis;
        return {
            id: shouldGenerateId ? this._generateId() :id,
            creator: userId,
            viewId,
            filterId,
            modelId
        };
    }

    _findAnalysis(userId, limit, offset, nameFilter, descriptionFilter, callback) {
        this.db.asCallback(
            (trx, callback) => {
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
                    .where('creator', userId)
                    .andWhere('name','like',`%${nameFilter}%`)
                    .andWhere('description', 'like',`%${descriptionFilter}%`)
                    .orderBy('timestamp', 'desc')
                    .offset(offset)
                    .limit(limit)
                    .asCallback(
                        (error, result) => {
                            this._parseAnalysesResult(result, callback);
                        }
                    );
            },
            callback
        );
    }

    _findAnalysisById(userId, analysisId, callback) {
        this.db.asCallback(
            (trx, callback) => {
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
                    .where('creator', userId)
                    .andWhere('id', analysisId)
                    .asCallback(
                        (error, result) => {
                            if (result && result.length){
                                this._parseAnalysesResult(
                                    result,
                                    (error, result) => {
                                        callback(null, result[0])
                                    }
                                );
                            }else {
                                callback(
                                    new Error(
                                        `Analysis item is not found ${analysisId}`
                                    )
                                )
                            }

                        }
                    );
            },
            callback
        );
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
            type
        } = camelcaseAnalysis[0];

        const sortedAnalyses = _.orderBy(camelcaseAnalysis,['order'],['asc']);
        const samples = _.map(
            sortedAnalyses,
            (sortedAnalysis) => {
                return {
                    id: sortedAnalysis.sampleVersionId,
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
            samples
        }
    }
}

module.exports = AnalysisModel;