import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';
import {setCurrentQueryHistoryId} from '../../../actions/queryHistory';
import {filtersListSetHistoryFilter} from '../../../actions/filtersList';
import {viewsListSetHistoryView} from '../../../actions/viewsList';


export default class AnalysisBody extends React.Component {

    render() {
        const selectedHistoryItem =
            this.props.currentHistoryId &&
            (
                this.props.editingHistoryList[this.props.currentHistoryId] ||
                this.findHistoryItemForId(this.props.currentHistoryId)
            ) ||
            this.props.newHistoryItem;

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
                            <AnalysisRightPane
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
        const selectedHistoryItem = id && this.findHistoryItemForId(id) || this.props.newHistoryItem;
        const filter = selectedHistoryItem.filter;
        this.props.dispatch(filtersListSetHistoryFilter(filter));
        const view = selectedHistoryItem.view;
        this.props.dispatch(viewsListSetHistoryView(view));
        this.props.dispatch(setCurrentQueryHistoryId(id));
    }
}
