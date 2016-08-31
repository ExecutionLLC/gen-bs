import _ from 'lodash';

import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';
import {setCurrentQueryHistoryId, toggleLoadingHistoryData} from '../../../actions/queryHistory';
import {filtersListSetHistoryFilter} from '../../../actions/filtersList';
import {viewsListSetHistoryView} from '../../../actions/viewsList';
import apiFacade from '../../../api/ApiFacade';
import {samplesListSetHistorySamples} from '../../../actions/samplesList';
import {modelsListSetHistoryModel} from '../../../actions/modelsList';


export default class AnalysisBody extends React.Component {

    render() {
        const selectedHistoryItem =
            this.props.currentHistoryId && this.findHistoryItemForId(this.props.currentHistoryId) ||
            this.props.newHistoryItem;
        const isLoadingHistoryData = this.props.isLoadingHistoryData;

        return (
            <Modal.Body>
                <div className='split-layout'>
                    <div className='split-left'>
                        <div className='split-wrap'>
                            <AnalysisLeftPane
                                dispatch={this.props.dispatch}
                                historyList={this.props.historyList}
                                initialHistoryList={this.props.initialHistoryList}
                                historyListFilter={this.props.historyListFilter}
                                newHistoryItem={this.props.newHistoryItem}
                                isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                                isHistoryRequesting={this.props.isHistoryRequesting}
                                currentItemId={this.props.currentHistoryId}
                                onSelectHistory={(id) => this.onSelectHistoryId(id)}
                                viewsList={this.props.viewsList}
                                filtersList={this.props.filtersList}
                                samplesList={this.props.samplesList}
                                modelsList={this.props.modelsList}
                            />
                        </div>
                    </div>
                    <div className='split-right tab-content'>
                        <div className='split-wrap tab-pane active'>
                            {!isLoadingHistoryData && <AnalysisRightPane
                                dispatch={this.props.dispatch}
                                disabled={!!this.props.currentHistoryId}
                                auth={this.props.auth}
                                historyItem={selectedHistoryItem}
                                currentItemId={this.props.currentHistoryId}
                                viewsList={this.props.viewsList}
                                filtersList={this.props.filtersList}
                                samplesList={this.props.samplesList}
                                modelsList={this.props.modelsList}
                                fields={this.props.fields}
                            />}
                        </div>
                    </div>
                </div>
            </Modal.Body>
        );
    }

    findHistoryItemForId(id) {
        return this.props.historyList.find((historyItem) => historyItem.id === id);
    }

    onSelectHistoryId(id) { // TODO make the same when first time displaying the dialog

        function getUsedSamplesIds(samples) { // TODO can it be rewritten through hashedArray?
            return _.reduce(samples, ({hash, array}, sample) => (hash[sample.id] ? {hash, array} : {hash: {...hash, [sample.id]: true}, array: [...array, sample.id]}), {hash: {}, array: []}).array;
        }

        const selectedHistoryItem = id && this.findHistoryItemForId(id) || this.props.newHistoryItem;
        const filterId = selectedHistoryItem.filterId;
        const viewId = selectedHistoryItem.viewId;
        const modelId = selectedHistoryItem.modelId;
        const samplesIds = getUsedSamplesIds(selectedHistoryItem.samples);

        const samplesHash = this.props.samplesList.hashedArray.hash;

        function getSamples(samplesIds, callback) {

            function getSample(sampleId, callback) {
                const existentSample = samplesHash[sampleId];
                if (existentSample) {
                    callback(existentSample);
                } else {
                    apiFacade.samplesClient.get(sampleId, (error, response) => {
                        callback(response.body);
                    });
                }
            }

            function getNextSample(samplesIds, index, samples) {
                if (index >= samplesIds.length) {
                    callback(samples);
                    return;
                }
                getSample(samplesIds[index], (sample) => {
                    const newSamples = [...samples, sample];
                    getNextSample(samplesIds, index + 1, newSamples);
                });
            }

            getNextSample(samplesIds, 0, []);
        }

        this.props.dispatch(toggleLoadingHistoryData(true));
        new Promise((resolve) => {
            const existentView = this.props.viewsList.hashedArray.hash[viewId];
            if (existentView) {
                resolve(existentView);
                return existentView;
            } else {
                return new Promise((resolve) => {
                    apiFacade.viewsClient.get(viewId, (error, response) => {
                        resolve(response.body);
                    });
                });
            }
        }).then((view) => {
            this.props.dispatch(viewsListSetHistoryView(view));
            const existentFilter = this.props.filtersList.hashedArray.hash[filterId];
            if (existentFilter) {
                return existentFilter;
            } else {
                return new Promise((resolve) => {
                    apiFacade.filtersClient.get(filterId, (error, response) => {
                        resolve(response.body);
                    });
                });
            }
        }).then((filter) => {
            this.props.dispatch(filtersListSetHistoryFilter(filter));
            if (modelId == null) {
                return null;
            }
            const existentModel = this.props.modelsList.hashedArray.hash[modelId];
            if (existentModel) {
                return existentModel;
            } else {
                return new Promise((resolve) => {
                    apiFacade.modelsClient.get(modelId, (error, response) => {
                        resolve(response.body);
                    });
                });
            }
        }).then((model) => {
            this.props.dispatch(modelsListSetHistoryModel(model));
            return new Promise((resolve) => {
                getSamples(samplesIds, resolve);
            });
        }).then((samples) => {
            this.props.dispatch(samplesListSetHistorySamples(samples));
            this.props.dispatch(setCurrentQueryHistoryId(id));
            this.props.dispatch(toggleLoadingHistoryData(false));
        });
    }
}
