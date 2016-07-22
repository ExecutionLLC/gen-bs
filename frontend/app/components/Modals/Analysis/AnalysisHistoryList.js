import React from 'react';
import {requestAppendQueryHistory} from '../../../actions/queryHistory';


export default class AnalysisHistoryList extends React.Component {
    render() {
        const {currentItemId, historyList} = this.props;
        return (
            <div className='split-scroll' ref='analysisHistoryListContainer'>
                <ul id='analysisTabs' className='nav nav-componets nav-controls nav-radios' ref='analysisHistoryList'>
                    {historyList.map((historyItem) => this.renderListItem(historyItem.id === currentItemId, historyItem))}
                </ul>
            </div>
        );
    }

    componentDidMount() {
        const scrollElement = this.refs.analysisHistoryList;
        const containerElement = this.refs.analysisHistoryListContainer;

        const self = this;

        function f() {
            if (!self.props.isHistoryReceivedAll) {
                if (scrollElement.scrollHeight - scrollElement.scrollTop < containerElement.clientHeight - 20) {
                    self.props.dispatch(requestAppendQueryHistory(self.props.historyListFilter, 2, self.props.historyList.length));
                }
            }
            setTimeout(f, 1000);
        }
        f();
    }

    renderListItem(isActive, historyItem) {
        return (
            <li
                key={historyItem.id}
                className={isActive ? 'active' : ''}
            >
                <a
                    type='button'
                    onClick={() => this.onHistoryItemClick(historyItem.id)}
                >
                    <label className='radio'>
                        <input type='radio' name='viewsRadios' />
                        <i />
                    </label>
                    <span className='link-label'>
                        {historyItem.name}
                    </span>
                    <span className='link-desc'>
                        {historyItem.description}
                    </span>
                    <span className='small link-desc'>
                        <span data-localize='query.last_query_date'>
                            Last query date
                        </span>: {historyItem.lastQueryDate}
                    </span>
                </a>
            </li>
        );
    }

    onHistoryItemClick(id) {
        this.props.onSelectHistory(id);
    }
}
