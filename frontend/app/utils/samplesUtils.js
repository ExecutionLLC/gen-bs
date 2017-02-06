import {analysisType} from './analyseUtils';


export const sampleType = {
    SINGLE: 'single',
    TUMOR: 'tumor',
    NORMAL: 'normal',
    PROBAND: 'proband',
    MOTHER: 'mother',
    FATHER: 'father'
};

export const sampleTypesForAnalysisType = {
    [analysisType.SINGLE]: [sampleType.SINGLE],
    [analysisType.TUMOR]: [sampleType.TUMOR, sampleType.NORMAL],
    [analysisType.FAMILY]: [sampleType.PROBAND, sampleType.MOTHER, sampleType.FATHER]
};

export function isMainSample(type) {
    return type === sampleType.TUMOR || type === sampleType.PROBAND;
}
