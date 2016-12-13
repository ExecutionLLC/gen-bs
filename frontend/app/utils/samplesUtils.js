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

export const typeLabels = {
    [sampleType.SINGLE]: 'S',
    [sampleType.TUMOR]: 'T',
    [sampleType.NORMAL]: 'N',
    [sampleType.PROBAND]: 'P',
    [sampleType.MOTHER]: 'M',
    [sampleType.FATHER]: 'F'
};

export function isMainSample(type) {
    return type === sampleType.TUMOR || type === sampleType.PROBAND;
}

export function makeSampleLabelAsFileGenotype(sample) {
    const {genotypeName, fileName} = sample; // TODO 757 fileName
    return `${fileName}:${genotypeName}`; // TODO 757 fileName
}

export function makeSampleLabel(sample) {
    const {genotypeName, fileName} = sample; // TODO 757 fileName
    return genotypeName ? makeSampleLabelAsFileGenotype(sample) : fileName; // TODO 757 fileName
}