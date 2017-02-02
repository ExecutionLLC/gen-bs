import React from 'react';
import classNames from 'classnames';
import {requestAppendAnalysesHistoryAsync} from '../../../actions/analysesHistory';
import * as i18n from '../../../utils/i18n';


const PAGINATION = {
    TIMEOUT_MS: 1000,
    COUNT: 10
};
const REFS = {
    CONTAINER: 'analysisHistoryListContainer',
    LOADING: 'analysisHistoryListLoading'
};

export default class AnalysisHistoryList extends React.Component {
    constructor(props) {
        super(props);
        this.loadingTimer = null;
    }

    render() {
        const {currentItemId, historyList, newHistoryItem, isHistoryReceivedAll} = this.props;
        return (
            <div className='split-scroll' ref={REFS.CONTAINER}>
                <ul id='analysisTabs' className='nav nav-componentes nav-with-right-menu'>
                    {newHistoryItem && this.renderListItem(!currentItemId, newHistoryItem, true)}
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
            if (loadingElement && loadingElement.offsetTop < containerElement.scrollTop + containerElement.clientHeight) {
                dispatch(requestAppendAnalysesHistoryAsync(historyListSearch, PAGINATION.COUNT, historyList.length));
            }
        }
        this.loadingTimer = setTimeout(() => this.checkAndLoadNext(), PAGINATION.TIMEOUT_MS);
    }

    componentDidMount() {
        this.checkAndLoadNext();
    }

    componentWillUnmount() {
        clearTimeout(this.loadingTimer);
    }

    renderListItem(isActive, historyItem, isNew) {
        const {ui: {languageId}} = this.props;
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
                        {isNew ? 'New analysis' : i18n.getEntityText(historyItem, languageId).name}
                    </span>
                    <span className='link-desc'>
                        {isNew ? 'Customize the settings for new analysis' : i18n.getEntityText(historyItem, languageId).description}
                    </span>
                </a>
            </li>
        );
    }

    renderLoadingListItem() {
        return (
            <li className='nav-header text-center loading' ref={REFS.LOADING}>
                <span className='md-i md-spin'>autorenew</span>
            </li>
        );
    }

    onHistoryItemClick(id) {
        this.props.onSelectHistory(id);
    }
}
