import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';


export default class AnalysisBody extends React.Component {

    constructor(props) { // TODO: rid of the state
        super(props);
        this.state = {
            currentHistoryItemId: props.historyList[0] && props.historyList[0].id || null
        };
    }

    render() {
        const selectedHistoryItem = this.state.currentHistoryItemId && (this.props.editingHistoryList[this.state.currentHistoryItemId] || this.findHistoryItemForId(this.state.currentHistoryItemId)) || this.props.newHistoryItem;

        return (
            <Modal.Body>
                <div className='split-layout'>
                    <div className='split-left'>
                        <div className='split-wrap'>
                            <AnalysisLeftPane
                                dispatch={this.props.dispatch}
                                historyList={this.props.historyList}
                                editingHistoryList={this.props.editingHistoryList}
                                historyListFilter={this.props.historyListFilter}
                                newHistoryItem={this.props.newHistoryItem}
                                isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                                currentItemId={this.state.currentHistoryItemId}
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
                            <AnalysisRightPane
                                dispatch={this.props.dispatch}
                                disabled={this.state.currentHistoryItemId && !this.props.editingHistoryList[this.state.currentHistoryItemId]}
                                auth={this.props.auth}
                                historyItem={selectedHistoryItem}
                                currentItemId={this.state.currentHistoryItemId}
                                viewsList={this.props.viewsList}
                                filtersList={this.props.filtersList}
                                samplesList={this.props.samplesList}
                                modelsList={this.props.modelsList}
                                fields={this.props.fields}
                            />
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
        this.setState({
            ...this.state,
            currentHistoryItemId: id
        });
    }
}
