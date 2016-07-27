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
        type: {
            single: {
                sample: historyItem.sample
            }
            /* TODO: make other types like this:
                        tumorNormal: {
                            samples: {
                                tumor: historyItem.sample,
                                normal: historyItem.sample
                            },
                            model: historyItem.filters[0]
                        }

                        family: {
                            samples: {
                                proband: historyItem.sample,
                                members: [
                                    {memberId: 'father', sample: historyItem.sample},
                                    {memberId: 'mother', sample: historyItem.sample}
                                ]
                            },
                            model: historyItem.filters[0]
                        }
            */
        }
    };
}

function makeNewHistoryItem(samplesList, filtersList, viewsList) {
    const filter = filtersList.hashedArray.hash[filtersList.selectedFilterId];
    const view = viewsList.hashedArray.hash[viewsList.selectedViewId];
    const sample = samplesList.hashedArray.hash[samplesList.selectedSampleId];
    const name = new Date() + '_' + (sample ? sample.fileName : '') + '_' + (filter ? filter.name : '') + '_' + (view ? view.name : '');
    return {
        id: null,
        name: name,
        description: 'Description of ' + name,
        createdDate: '' + new Date(),
        lastQueryDate: '' + new Date(),
        filter: filter,
        view: view,
        type: {
            single: {
                sample: sample
            }
            /* TODO: make other types like this:
                        tumorNormal: {
                            samples: {
                                tumor: historyItem.sample,
                                normal: historyItem.sample
                            },
                            model: historyItem.filters[0]
                        }

                        family: {
                            samples: {
                                proband: historyItem.sample,
                                members: [
                                    {memberId: 'father', sample: historyItem.sample},
                                    {memberId: 'mother', sample: historyItem.sample}
                                ]
                            },
                            model: historyItem.filters[0]
                        }
            */
        }
    };
}

const HistoryItemUtils = {
    makeHistoryItem,
    makeNewHistoryItem,
};

export default HistoryItemUtils;