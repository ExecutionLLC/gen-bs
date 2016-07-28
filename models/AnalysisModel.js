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
    'sampleId',
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
                    id: sortedAnalysis.sampleId,
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