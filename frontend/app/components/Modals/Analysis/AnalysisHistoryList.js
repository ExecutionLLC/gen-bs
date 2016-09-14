import React from 'react';
import classNames from 'classnames';
import {requestAppendAnalysesHistory} from '../../../actions/analysesHistory';


const PAGINATION = {
    TIMEOUT_MS: 1000,
    COUNT: 10
};
const REFS = {
    CONTAINER: 'analysisHistoryListContainer',
    LOADING: 'analysisHistoryListLoading'
};

export default class AnalysisHistoryList extends React.Component {
    render() {
        const {currentItemId, historyList, newHistoryItem, isHistoryReceivedAll} = this.props;
        return (
            <div className='split-scroll' ref={REFS.CONTAINER}>
                <ul id='analysisTabs' className='nav nav-componets nav-controls nav-radios'>
                    {newHistoryItem && this.renderListItem(!currentItemId, newHistoryItem)}
                    {historyList.map((historyItem) => this.renderListItem(historyItem.id === currentItemId, historyItem))}
                    {!isHistoryReceivedAll && this.renderLoadingListItem()}
                </ul>
            </div>
        );
    }

    checkAndLoadNext() {
        const {dispatch, isHistoryReceivedAll, isHistoryRequesting, historyList, historyListSearch} = this.props;

        const containerElement = this.refs[REFS.CONTAINER];
        const loadingElement = this.refs[REFS.LOADING];

        if (!isHistoryReceivedAll && !isHistoryRequesting) {
            if (loadingElement.offsetTop < containerElement.scrollTop + containerElement.clientHeight) {
                dispatch(requestAppendAnalysesHistory(historyListSearch, PAGINATION.COUNT, historyList.length));
            }
        }
        setTimeout(() => this.checkAndLoadNext(), PAGINATION.TIMEOUT_MS);
    }

    componentDidMount() {
        this.checkAndLoadNext();
    }

    renderListItem(isActive,historyItem) {
        return (
            <li
                key={historyItem.id}
                className={classNames({
                    'active': isActive
                })}
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

    renderLoadingListItem() {
        return (
            <li className='loading' ref={REFS.LOADING}>
                <span className='md-i'>autorenew</span>
            </li>
        );
    }

    onHistoryItemClick(id) {
        this.props.onSelectHistory(id);
    }
}
