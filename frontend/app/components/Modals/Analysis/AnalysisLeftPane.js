import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {
    prepareQueryHistoryToFilter,
    requestQueryHistory,
    appendQueryHistory
} from '../../../actions/queryHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {historyList, initialHistoryList, historyListFilter, isHistoryReceivedAll, isHistoryRequesting, newHistoryItem} = this.props; // TODO rename historyListFilter
        // TODO rename 'filter'
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
                    historyListFilter={historyListFilter}
                    newHistoryItem={newHistoryItem}
                    isHistoryReceivedAll={isHistoryReceivedAll}
                    isHistoryRequesting={isHistoryRequesting}
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
            this.props.dispatch(requestQueryHistory());
            this.props.dispatch(appendQueryHistory('', 0, this.props.initialHistoryList, false));
        }
    }
}
