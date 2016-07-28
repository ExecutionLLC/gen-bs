'use strict';

const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Analysis: 'analysis',
    AnalysisTexts: 'analysis_text',
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
}