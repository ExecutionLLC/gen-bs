const sampleType = {
    SINGLE: 'single',
    TUMOR: 'tumor',
    NORMAL: 'normal',
    PROBAND: 'proband',
    MOTHER: 'mother',
    FATHER: 'father'
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
    typeLabels
};

export default SamplesUtils;