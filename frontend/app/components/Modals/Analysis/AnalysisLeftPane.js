import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';


export default class AnalysisLeftPane extends React.Component {
    render() {
        return (
            <div>
                <AnalysisHistorySearch />
                <AnalysisHistoryList
                    historyList={this.props.historyList}
                    currentItemId={this.props.currentItemId}
                    onSelectHistory={this.props.onSelectHistory}
                />
            </div>
        );
    }
}
