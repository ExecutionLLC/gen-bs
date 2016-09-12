import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {
    prepareQueryHistoryToSearch,
    requestQueryHistory,
    appendQueryHistory
} from '../../../actions/queryHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {historyList, initialHistoryList, historyListSearch, isHistoryReceivedAll, isHistoryRequesting, newHistoryItem} = this.props;

        return (
            <div>
                <AnalysisHistorySearch
                    search={historyListSearch}
                    onSearch={(str) => this.onSearchChange(str)}
                />
                <AnalysisHistoryList
                    dispatch={this.props.dispatch}
                    historyList={historyList}
                    initialHistoryList={initialHistoryList}
                    historyListSearch={historyListSearch}
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

    onSearchChange(str) {
        this.props.dispatch(prepareQueryHistoryToSearch(str));
        if (!str) {
            this.props.dispatch(requestQueryHistory());
            this.props.dispatch(appendQueryHistory('', 0, this.props.initialHistoryList, false));
        }
    }
}
