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

function changeType(historyItem, samplesList, filtersList, viewsList, modelsList, targetType) {

    const typeConverts = {
        single: {
            tumorNormal(type) {
                return {
                    tumorNormal: {
                        samples: {
                            tumor: type.single.sample,
                            normal: type.single.sample
                        },
                        model: modelsList[0]
                    }
                };
            },
            family(type) {
                return {
                    family: {
                        samples: {
                            proband: type.single.sample,
                            members: [
                                {memberId: 'father', sample: type.single.sample},
                                {memberId: 'mother', sample: type.single.sample}
                            ]
                        },
                        model: modelsList[0]
                    }
                };
            }
        },
        tumorNormal: {
            single(type) {
                return {
                    single: {
                        sample: type.tumorNormal.samples.tumor
                    }
                };
            },
            family(type) {
                return {
                    family: {
                        samples: {
                            proband: type.tumorNormal.samples.tumor,
                            members: [
                                {memberId: 'father', sample: type.tumorNormal.samples.normal},
                                {memberId: 'mother', sample: type.tumorNormal.samples.normal}
                            ]
                        },
                        model: modelsList[0]
                    }
                };
            }
        },
        family: {
            single(type) {
                return {
                    single: {
                        sample: type.family.samples.proband
                    }
                };
            },
            tumorNormal(type) {
                return {
                    tumorNormal: {
                        samples: {
                            tumor: type.family.samples.proband,
                            normal: type.family.samples.proband // TODO make if 'father' or 'mother'
                        },
                        model: modelsList[0]
                    }
                };
            }
        }
    };

    const originalType = historyItem.type;
    var convertTypeFrom;
    if (originalType.single) {
        convertTypeFrom = typeConverts.single;
    } else if (originalType.tumorNormal) {
        convertTypeFrom = typeConverts.tumorNormal;
    } else {
        convertTypeFrom = typeConverts.family;
    }
    var convertTypeTo;
    if (targetType.single) {
        convertTypeTo = convertTypeFrom.single;
    } else if (targetType.tumorNormal) {
        convertTypeTo = convertTypeFrom.tumorNormal;
    } else {
        convertTypeTo = convertTypeFrom.family;
    }
    var newType = convertTypeTo ? convertTypeTo(historyItem.type) : historyItem.type;
    return {
        ...historyItem,
        type: newType
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
    return editingHistoryItem;
}

const HistoryItemUtils = {
    makeHistoryItem,
    makeNewHistoryItem,
    changeHistoryItem
};

export default HistoryItemUtils;