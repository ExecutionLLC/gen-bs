//import _ from 'lodash';

import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';
import {setCurrentQueryHistoryIdLoadData} from '../../../actions/queryHistory';


export default class AnalysisBody extends React.Component {

    render() {
        const selectedHistoryItem =
            this.props.currentHistoryId ?
                this.findHistoryItemForId(this.props.currentHistoryId) :
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
                                isOnlyItem={!this.props.historyList.length}
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
        this.props.dispatch(setCurrentQueryHistoryIdLoadData(id));
    }
}
