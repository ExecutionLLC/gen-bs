import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';


export default class AnalysisLeftPane extends React.Component {
    render() {
        return (
            <div>
                <AnalysisHistorySearch />
                <AnalysisHistoryList
                    queryHistory={this.props.queryHistory}
                />
            </div>
        );
    }
}
