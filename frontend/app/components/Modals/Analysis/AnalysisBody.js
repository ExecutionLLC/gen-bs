import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';
import {setCurrentQueryHistoryIdLoadData} from '../../../actions/analysesHistory';


export default class AnalysisBody extends React.Component {

    render() {
        const {
            dispatch,
            currentHistoryId, newHistoryItem, isLoadingHistoryData
        } = this.props;
        const selectedHistoryItem =
            currentHistoryId ?
                this.findHistoryItemForId(currentHistoryId) :
                newHistoryItem;

        return (
            <Modal.Body>
                <div className='split-layout'>
                    <div className='split-left'>
                        <div className='split-wrap'>
                            <AnalysisLeftPane
                                dispatch={dispatch}
                                historyList={this.props.historyList}
                                initialHistoryList={this.props.initialHistoryList}
                                historyListSearch={this.props.historyListSearch}
                                newHistoryItem={newHistoryItem}
                                isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                                isHistoryRequesting={this.props.isHistoryRequesting}
                                currentItemId={currentHistoryId}
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
                                dispatch={dispatch}
                                disabled={!!currentHistoryId}
                                auth={this.props.auth}
                                historyItem={selectedHistoryItem}
                                currentItemId={currentHistoryId}
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
        const {historyList} = this.props;
        return historyList.find((historyItem) => historyItem.id === id);
    }

    onSelectHistoryId(id) {
        const {dispatch} = this.props;
        dispatch(setCurrentQueryHistoryIdLoadData(id));
    }
}
