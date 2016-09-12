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

        const {dispatch,
            historyList, initialHistoryList, historyListSearch, isHistoryReceivedAll, isHistoryRequesting, newHistoryItem} = this.props;

        return (
            <div>
                <AnalysisHistorySearch
                    search={historyListSearch}
                    onSearch={(str) => this.onSearchChange(str)}
                />
                <AnalysisHistoryList
                    dispatch={dispatch}
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
        const {dispatch, initialHistoryList} = this.props;
        dispatch(prepareQueryHistoryToSearch(str));
        if (!str) {
            dispatch(requestQueryHistory());
            dispatch(appendQueryHistory('', 0, initialHistoryList, false));
        }
    }
}
