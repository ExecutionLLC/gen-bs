import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';
import {
    prepareAnalysesHistoryToSearch
} from '../../../actions/analysesHistory';


export default class AnalysisLeftPane extends React.Component {

    render() {

        const {
            dispatch, historyList, initialHistoryList, historyListSearch,
            isHistoryReceivedAll, isHistoryRequesting, newHistoryItem, ui, p
        } = this.props;

        return (
            <div className='split-left'>
                <AnalysisHistorySearch
                    search={historyListSearch}
                    onSearch={(str) => this.onSearchChange(str)}
                    p={p}
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
                    ui={ui}
                    p={p}
                />
            </div>
        );
    }

    onSearchChange(str) {
        const {dispatch, newHistoryItem, onSelectHistory} = this.props;
        dispatch(prepareAnalysesHistoryToSearch(str));
        if (newHistoryItem) {
            onSelectHistory(newHistoryItem.id);
        }
    }
}
