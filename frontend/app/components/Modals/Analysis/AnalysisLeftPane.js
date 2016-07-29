import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {
    prepareQueryHistoryToFilter,
    appendQueryHistory
} from '../../../actions/queryHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {historyList, initialHistoryList, editingHistoryList, historyListFilter, isHistoryReceivedAll, newHistoryItem} = this.props;

        return (
            <div>
                <AnalysisHistorySearch
                    filter={historyListFilter}
                    onFilter={(str) => this.onFilterChange(str)}
                />
                <AnalysisHistoryList
                    dispatch={this.props.dispatch}
                    historyList={historyList}
                    initialHistoryList={initialHistoryList}
                    editingHistoryList={editingHistoryList}
                    historyListFilter={historyListFilter}
                    newHistoryItem={newHistoryItem}
                    isHistoryReceivedAll={isHistoryReceivedAll}
                    currentItemId={this.props.currentItemId}
                    onSelectHistory={this.props.onSelectHistory}
                    viewsList={this.props.viewsList}
                    filtersList={this.props.filtersList}
                />
            </div>
        );
    }

    onFilterChange(str) {
        this.props.dispatch(prepareQueryHistoryToFilter(str));
        if (!str) {
            this.props.dispatch(appendQueryHistory('', 0, this.props.initialHistoryList, false));
        }
    }
}
