import _ from 'lodash';

import immutableArray from './immutableArray';
import {entityTypeIsDemoDisabled} from './entityTypes';
import SamplesUtils from './samplesUtils';
import AnalyseUtils from './analyseUtils';


const {sampleType, sampleTypeForAnalysisType} = SamplesUtils;
const {analysisType} = AnalyseUtils;

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
        filterId: filter ?
            filter.id :
            null,
        viewId: view ? view.id : null,
        type: analysisType.SINGLE,
        modelId: null,
        samples: [{
            id: sample ? sample.id : null,
            type: sampleType.SINGLE
        }]
/* can make other types like this:
        // tumor
        type: analysisType.TUMOR,
        model: historyItem.filters[0] // select approptiate
        samples: [
            {
                id: sample.id, // select approptiate
                type: sampleType.TUMOR
            },
            {
                id: sample.id, // select approptiate
                type: sampleType.NORMAL
            }
        ]
        // family
        type: analysisType.FAMILY,
        model: historyItem.filters[0] // select approptiate
        samples: [
            {
                id: sample.id, // select approptiate
                type: sampleType.PROBAND
            },
            {
                id: sample.id, // select approptiate
                type: sampleType.MOTHER
            },
            {
                id: historyItem.sample.id, // select approptiate
                type: sampleType.FATHER
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

function changeSamplesArray(oldSamples, samplesList, isDemo, newSamplesTypes) {
    const usedSamplesIds = {};
    return newSamplesTypes.map(
        (type, index) => {
            const oldSample = oldSamples[index];
            if (oldSample) {
                const oldSampleId = oldSample.id;
                usedSamplesIds[oldSampleId] = true;
                return {id: oldSampleId, type: type};
            } else {
                const unusedSample = _.find(
                        samplesList.hashedArray.array,
                        (sample) => !usedSamplesIds[sample.id] && !entityTypeIsDemoDisabled(sample.type, isDemo)
                    ) ||
                    samplesList.hashedArray.array[0];
                const unusedSampleId = unusedSample.id;
                usedSamplesIds[unusedSampleId] = true;
                return {id: unusedSampleId, type: type};
            }
        }
    );
}

function changeType(historyItem, samplesList, filtersList, viewsList, modelsList, isDemo, targetType) {

    function getAvailableModel(type) {
        const model = _.find(
            modelsList.hashedArray.array,
            (model) => !entityTypeIsDemoDisabled(model.type, isDemo) && model.analysisType === type
        );
        return model && model.id;
    }

    function typeConvert(historyItem, newType) {
        const {modelId} = historyItem;

        const model = modelId && modelsList.hashedArray.hash[modelId];
        const newModelId = newType === analysisType.SINGLE ?
            null :
            model && model.analysisType === newType ?
                modelId :
                getAvailableModel(newType);
        const newSamples = changeSamplesArray(
            historyItem.samples,
            samplesList,
            isDemo,
            sampleTypeForAnalysisType[newType]
        );

        return {
            ...historyItem,
            samples: newSamples,
            modelId: newModelId,
            type: newType
        };
    }

    return typeConvert(historyItem, targetType);
}

function changeHistoryItem(historyItem, samplesList, filtersList, viewsList, modelsList, isDemo, change) {
    var editingHistoryItem = historyItem;
    if (change.name != null) {
        editingHistoryItem = {...editingHistoryItem, name: change.name};
    }
    if (change.description != null) {
        editingHistoryItem = {...editingHistoryItem, description: change.description};
    }
    if (change.type != null) {
        editingHistoryItem = changeType(editingHistoryItem, samplesList, filtersList, viewsList, modelsList, isDemo, change.type);
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