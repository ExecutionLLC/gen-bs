import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {prepareToFilter} from '../../../actions/queryHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {historyList: historyListFilteredArray, historyListFilter, isHistoryReceivedAll, newListItem} = this.props;

        return (
            <div>
                <AnalysisHistorySearch
                    filter={historyListFilter}
                    onFilter={(str) => this.onFilterChange(str)}
                />
                <AnalysisHistoryList
                    dispatch={this.props.dispatch}
                    historyList={historyListFilteredArray}
                    historyListFilter={historyListFilter}
                    newListItem={newListItem}
                    isHistoryReceivedAll={isHistoryReceivedAll}
                    currentItemId={this.props.currentItemId}
                    onSelectHistory={this.props.onSelectHistory}
                />
            </div>
        );
    }

    onFilterChange(str) {
        this.props.dispatch(prepareToFilter(str));
    }
}
