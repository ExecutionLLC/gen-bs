import React from 'react';
import AnalysisHistorySearch from './AnalysisHistorySearch';
import AnalysisHistoryList from './AnalysisHistoryList';


export default class AnalysisLeftPane extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filter: ''
        };
    }

    render() {

        const historyListArray = this.props.historyList;
        const filterLowercase = this.state.filter.toLowerCase();
        const historyListFilteredArray = historyListArray.filter((item) => item.name.toLocaleLowerCase().indexOf(filterLowercase) >= 0);

        return (
            <div>
                <AnalysisHistorySearch
                    onChange={(str) => this.onFilterChange(str)}
                />
                <AnalysisHistoryList
                    historyList={historyListFilteredArray}
                    currentItemId={this.props.currentItemId}
                    onSelectHistory={this.props.onSelectHistory}
                />
            </div>
        );
    }

    onFilterChange(str) {
        this.setState({...this.state, filter: str});
    }
}
