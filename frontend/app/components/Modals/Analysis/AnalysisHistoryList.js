import React from 'react';


export default class AnalysisHistoryList extends React.Component {
    render() {
        const {currentItemId, historyList} = this.props;
        return (
            <div className='split-scroll'>
                <ul id='analysisTabs' className='nav nav-componets nav-controls nav-radios'>
                    {historyList.map((historyItem) => this.renderListItem(historyItem.id === currentItemId, historyItem))}
                </ul>
            </div>
        );
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
