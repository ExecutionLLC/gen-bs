import AnalyseUtils from './analyseUtils';


const {analysisType} = AnalyseUtils;

const sampleType = {
    SINGLE: 'single',
    TUMOR: 'tumor',
    NORMAL: 'normal',
    PROBAND: 'proband',
    MOTHER: 'mother',
    FATHER: 'father'
};

const sampleTypeForAnalysisType = {
    [analysisType.SINGLE]: [sampleType.SINGLE],
    [analysisType.TUMOR]: [sampleType.TUMOR, sampleType.NORMAL],
    [analysisType.FAMILY]: [sampleType.PROBAND, sampleType.MOTHER, sampleType.FATHER]
};

const typeLabels = {
    [sampleType.SINGLE]: 'S',
    [sampleType.TUMOR]: 'T',
    [sampleType.NORMAL]: 'N',
    [sampleType.PROBAND]: 'P',
    [sampleType.MOTHER]: 'M',
    [sampleType.FATHER]: 'F'
};

const SamplesUtils = {
    sampleType,
    typeLabels,
    sampleTypeForAnalysisType
};

export default SamplesUtils;