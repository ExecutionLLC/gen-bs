import * as _ from 'lodash';
import * as async from 'async';

import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';
import {setCurrentQueryHistoryId, toggleLoadingHistoryData} from '../../../actions/queryHistory';
import {filtersListSetHistoryFilter} from '../../../actions/filtersList';
import {viewsListSetHistoryView} from '../../../actions/viewsList';
import apiFacade from '../../../api/ApiFacade';


export default class AnalysisBody extends React.Component {

    render() {
        const selectedHistoryItem =
            this.props.currentHistoryId &&
            (
                this.props.editingHistoryList[this.props.currentHistoryId] ||
                this.findHistoryItemForId(this.props.currentHistoryId)
            ) ||
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
                                editingHistoryList={this.props.editingHistoryList}
                                historyListFilter={this.props.historyListFilter}
                                newHistoryItem={this.props.newHistoryItem}
                                isHistoryReceivedAll={this.props.isHistoryReceivedAll}
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
                                disabled={this.props.currentHistoryId && !this.props.editingHistoryList[this.props.currentHistoryId]}
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

    onSelectHistoryId(id) {

        function getUsedSamplesIds(samples) {
            return _.reduce(samples, ({hash, array}, sample) => (hash[sample.id] ? {hash, array} : {hash: {...hash, [sample.id]: true}, array: [...array, sample.id]}), {hash: {}, array: []}).array;
        }

        const selectedHistoryItem = id && this.findHistoryItemForId(id) || this.props.newHistoryItem;
        const filterId = selectedHistoryItem.filterId;
        const viewId = selectedHistoryItem.viewId;
        const modelId = selectedHistoryItem.modelId;
        const samplesIds = getUsedSamplesIds(selectedHistoryItem.samples);
        async.waterfall([
            (callback) => {this.props.dispatch(toggleLoadingHistoryData(true)); callback(null);},
            (callback) => {
                const existentView = this.props.viewsList.hashedArray.hash[viewId];
                if (existentView) {
                    callback(null, existentView);
                } else {
                    apiFacade.viewsClient.get(viewId, (error, response) => {
                        callback(null, response.body);
                    });
                }
            },
            (view, callback) => {
                this.props.dispatch(viewsListSetHistoryView(view));
                callback(null);
            },
            (callback) => {this.props.dispatch(setCurrentQueryHistoryId(id)); callback(null); },
            (callback) => {this.props.dispatch(toggleLoadingHistoryData(false)); callback(null);}
        ]);
    }
}
