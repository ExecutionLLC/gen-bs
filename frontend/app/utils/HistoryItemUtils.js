import _ from 'lodash';

import immutableArray from './immutableArray';


function makeHistoryItem(historyItem) {
    return {
        ...historyItem,
        name: `Copy of ${historyItem.name}`.slice(0, 50),
        createdDate: '' + new Date(),
        lastQueryDate: '' + new Date(),
        id: null
    };
}

function makeNewHistoryItem(sample, filter, view) {
    const name = (new Date() + '_' + (sample ? sample.fileName : '') + '_' + (filter ? filter.name : '') + '_' + (view ? view.name : '')).slice(0, 50);
    return {
        id: null,
        name: name,
        description: 'Description of ' + name,
        createdDate: '' + new Date(),
        lastQueryDate: '' + new Date(),
        filterId: filter && filter.id || null,
        viewId: view && view.id || null,
        type: 'single',
        modelId: null,
        samples: [{
            id: sample && sample.id || null,
            type: 'single'
        }]
/* TODO: make other types like this:
        // tumor
        type: 'tumor',
        model: historyItem.filters[0]
        samples: [
            {
                id: sample.id,
                type: 'tumor'
            },
            {
                id: sample.id,
                type: 'normal'
            }
        ]
        // family
        type: 'family',
        model: historyItem.filters[0]
        samples: [
            {
                id: sample.id,
                type: 'proband'
            },
            {
                id: sample.id,
                type: 'mother'
            },
            {
                id: historyItem.sample.id,
                type: 'father'
            }
        ]
 */
    };
}

function changeSampleId(oldSamples, sampleIndex, newSampleId) {
    const sampleExistIndex = _.findIndex(oldSamples, (model, index) => index !== sampleIndex && model.id === newSampleId);
    const replacedSample = oldSamples[sampleIndex];
    const newSamplesWithNewSample = immutableArray.replace(oldSamples, sampleIndex, {...replacedSample, id: newSampleId});
    if (sampleExistIndex < 0) {
        return newSamplesWithNewSample;
    } else {
        return immutableArray.replace(newSamplesWithNewSample, sampleExistIndex, {...newSamplesWithNewSample[sampleExistIndex], id: replacedSample.id});
    }
}

function changeSamplesArray(oldSamples, samplesList, newSamplesTypes) {
    const usedSamplesIds = {};
    return newSamplesTypes.map(
        (type, index) => {
            const oldSample = oldSamples[index];
            if (oldSample) {
                const oldSampleId = oldSample.id;
                usedSamplesIds[oldSampleId] = true;
                return {id: oldSampleId, type: type};
            } else {
                const unusedSample = _.find(samplesList.hashedArray.array, (sample) => !usedSamplesIds[sample.id]) || samplesList.hashedArray.array[0];
                const unusedSampleId = unusedSample.id;
                usedSamplesIds[unusedSampleId] = true;
                return {id: unusedSampleId, type: type};
            }
        }
    );
}

function changeType(historyItem, samplesList, filtersList, viewsList, modelsList, targetType) {

    const typeConverts = {
        'single': {
            'tumor'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['tumor', 'normal']),
                    modelId: modelsList.hashedArray.array[0].id
                };
            },
            'family'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['proband', 'mother', 'father']),
                    modelId: modelsList.hashedArray.array[0].id
                };
            }
        },
        'tumor': {
            'single'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['single']),
                    modelId: null
                };
            },
            'family'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['proband', 'mother', 'father']),
                    modelId: modelsList.hashedArray.array[0].id
                };
            }
        },
        'family': {
            'single'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['single']),
                    modelId: null
                };
            },
            'tumor'(historyItem) {
                return {
                    samples: changeSamplesArray(historyItem.samples, samplesList, ['tumor', 'normal']),
                    modelId: modelsList.hashedArray.array[0].id
                };
            }
        }
    };

    const convertTypeFrom = typeConverts[historyItem.type];
    const convertTypeTo = convertTypeFrom && convertTypeFrom[targetType];
    if (!convertTypeTo) {
        return historyItem;
    }
    var newSamplesModel = convertTypeTo ? convertTypeTo(historyItem) : historyItem;
    return {
        ...historyItem,
        samples: newSamplesModel.samples,
        modelId: newSamplesModel.modelId,
        type: targetType
    };
}

function changeHistoryItem(historyItem, samplesList, filtersList, viewsList, modelsList, change) {
    var editingHistoryItem = historyItem;
    if (change.name != null) {
        editingHistoryItem = {...editingHistoryItem, name: change.name};
    }
    if (change.description != null) {
        editingHistoryItem = {...editingHistoryItem, description: change.description};
    }
    if (change.type != null) {
        editingHistoryItem = changeType(editingHistoryItem, samplesList, filtersList, viewsList, modelsList, change.type);
    }
    if (change.sample != null) {
        editingHistoryItem = {...editingHistoryItem, samples: changeSampleId(editingHistoryItem.samples, change.sample.index, change.sample.id)};
    }
    if (change.samples != null) {
        editingHistoryItem = {...editingHistoryItem, samples: change.samples};
    }
    if (change.filterId != null) {
        editingHistoryItem = {...editingHistoryItem, filterId: change.filterId};
    }
    if (change.viewId != null) {
        editingHistoryItem = {...editingHistoryItem, viewId: change.viewId};
    }
    if (change.modelId != null) {
        editingHistoryItem = {...editingHistoryItem, modelId: change.modelId};
    }
    return editingHistoryItem;
}

const HistoryItemUtils = {
    makeHistoryItem,
    makeNewHistoryItem,
    changeHistoryItem
};

export default HistoryItemUtils;