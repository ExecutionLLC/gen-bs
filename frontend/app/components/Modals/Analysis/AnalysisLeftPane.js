import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {prepareQueryHistoryToFilter} from '../../../actions/queryHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {historyList, historyListFilter, isHistoryReceivedAll, newListItem} = this.props;

        return (
            <div>
                <AnalysisHistorySearch
                    filter={historyListFilter}
                    onFilter={(str) => this.onFilterChange(str)}
                />
                <AnalysisHistoryList
                    dispatch={this.props.dispatch}
                    historyList={historyList}
                    historyListFilter={historyListFilter}
                    newListItem={newListItem}
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
    }
}
