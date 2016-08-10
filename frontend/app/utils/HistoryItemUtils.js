function makeHistoryItem(historyItem) {
    const name = historyItem.timestamp + '_' + historyItem.sample.fileName + '_' + historyItem.filters[0].name + '_' + historyItem.view.name;
    return {
        id: historyItem.id,
        name: name,
        description: 'Description of ' + name,
        createdDate: historyItem.timestamp,
        lastQueryDate: historyItem.timestamp + 1000,
        filter: historyItem.filters[0],
        view: historyItem.view,
        // single
        type: 'single', // 'tumor', 'family'
        samples: [{
            id: historyItem.sample && historyItem.sample.id || null,
            type: 'single'
        }]
/* TODO: make other types like this:
        // tumor
        type: 'tumor',
        model: historyItem.filters[0]
        samples: [
            {
                id: historyItem.sample.id,
                type: 'tumor'
            },
            {
                id: historyItem.sample.id,
                type: 'normal'
            }
        ]
        // family
        type: 'family',
        model: historyItem.filters[0]
        samples: [
            {
                id: historyItem.sample.id,
                type: 'proband'
            },
            {
                id: historyItem.sample.id,
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

function makeNewHistoryItem(sample, filter, view) {
    const name = new Date() + '_' + (sample ? sample.fileName : '') + '_' + (filter ? filter.name : '') + '_' + (view ? view.name : '');
    return {
        id: null,
        name: name,
        description: 'Description of ' + name,
        createdDate: '' + new Date(),
        lastQueryDate: '' + new Date(),
        filterId: filter && filter.id || null,
        viewId: view && view.id || null,
        type: 'single',
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

function changeType(historyItem, samplesList, filtersList, viewsList, modelsList, targetType) {

    const typeConverts = {
        'single': {
            'tumor'(historyItem) {
                return {
                    samples: [
                        {id: historyItem.samples[0].id, type: 'tumor'},
                        {id: historyItem.samples[0].id, type: 'normal'}
                    ],
                    modelId: modelsList.models[0].id
                };
            },
            'family'(historyItem) {
                return {
                    samples: [
                        {id: historyItem.samples[0].id, type: 'proband'},
                        {id: historyItem.samples[0].id, type: 'mother'},
                        {id: historyItem.samples[0].id, type: 'father'}
                    ],
                    modelId: modelsList.models[0].id
                };
            }
        },
        'tumor': {
            'single'(historyItem) {
                return {
                    samples: [{id: historyItem.samples[0].id, type: 'single'}]
                };
            },
            'family'(historyItem) {
                return {
                    samples: [
                        {id: historyItem.samples[0].id, type: 'proband'},
                        {id: historyItem.samples[1].id, type: 'mother'},
                        {id: historyItem.samples[1].id, type: 'father'}
                    ],
                    modelId: modelsList.models[0].id
                };
            }
        },
        'family': {
            'single'(historyItem) {
                return {
                    samples: [{id: historyItem.samples[0].id, type: 'single'}]
                };
            },
            'tumor'(historyItem) {
                return {
                    samples: [
                        {id: historyItem.samples[0].id, type: 'tumor'},
                        {id: historyItem.samples[1].id, type: 'normal'}
                    ],
                    modelId: modelsList.models[0].id
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