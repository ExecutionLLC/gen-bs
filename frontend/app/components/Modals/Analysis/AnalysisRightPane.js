import React from 'react';


export default class AnalysisRightPane extends React.Component {
    render() {
        return (
            <div>
                {this.renderNewAnalysisTitle()}
                {this.renderAnalysisHeader(this.props.historyItem)}
            </div>
        );
    }

    renderNewAnalysisTitle() {
        return (
            <div className='navbar navbar-fixed-top navbar-inverse visible-xs'>
                <button
                    type='button'
                    className='btn navbar-btn pull-right'
                    onClick={() => this.onNewAnalysisCancelClick()}
                >
                    <i className='md-i'>close</i>
                </button>
                <h3 className='navbar-text'>
                    New analysis
                </h3>
            </div>
        );
    }

    renderAnalysisHeader(historyItem) {
        return (
            <div className='split-right-top split-right-top-tabs form-horizontal'>
                {this.renderSelectAnalysis()}
                {this.renderDeleteAnalysis()}

                <div className='form-group'>
                    <div className='col-md-12 col-xs-12'>
                        <input
                            value={historyItem.name}
                            className='form-control material-input-sm material-input-heading text-primary'
                            placeholder="Analysis name (it can't be empty)"
                            data-localize='query.settings.name'
                            onChange={(e) => this.onAnalysisNameChange(e.target.value)}
                        />
                    </div>
                </div>
                <div className='label-date'>
                    <label>
                        <span data-localize='general.created_date'>Created date</span>: <span>{historyItem.createdDate}</span>
                    </label>
                    <label>
                        <span data-localize='query.last_query_date'>Last query date</span>: <span>{historyItem.lastQueryDate}</span>
                    </label>
                </div>
                <div className='form-group'>
                    <div className='col-md-12 col-xs-12'>
                        <input
                            value={historyItem.description}
                            placeholder='Analysis description (optional)'
                            className='form-control material-input-sm'
                            data-localize='query.settings.description'
                            onChange={(e) => this.onAnalysisDescriptionChange(e.target.value)}
                        />
                    </div>
                </div>
                {this.renderAnalysisHeaderTabs()}
            </div>
        );
    }

    renderSelectAnalysis() {
        return (
            <div className='navbar navbar-list-toggle visible-xs'>
                <button
                    id='openAnalisis'
                    type='button'
                    className='btn btn-link-default navbar-btn'
                    onClick={() => this.onSelectAnalysisClick()}
                >
                    <i className='md-i'>menu</i>
                    <span data-localize='query.select_analysis'>Select analysis</span>
                </button>
            </div>
        );
    }

    renderDeleteAnalysis() {
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                onClick={() => this.onDeleteAnalysisClick()}
            >
                <span data-localize='query.delete_analysis'>Delete analysis</span>
            </button>
        );
    }

    renderAnalysisHeaderTabs() {
        const tabs = [
            {
                isActive: true,
                className: 'single-tab',
                caption: 'Single',
                onSelect: () => {}
            },
            {
                isActive: false,
                className: 'tumor-normal-tab',
                caption: 'Tumor/Normal',
                onSelect: () => {}
            },
            {
                isActive: false,
                className: 'family-tab',
                caption: 'Family',
                onSelect: () => {}
            }
        ];
        return (
            <ul role='tablist' className='nav nav-tabs' id='analisisTypes'>
                {tabs.map((tab) => this.renderAnalysisHeaderTab(tab.isActive, tab.className, tab.caption, tab.onSelect))}
            </ul>
        );
    }

    renderAnalysisHeaderTab(isActive, tabClassName, tabCaption, onClick) {
        return (
            <li
                key={tabClassName}
                className={tabClassName + ' ' + (isActive ? 'active' : '')}
                role='presentation'
            >
                <a
                    role='tab'
                    onClick={onClick}
                >
                    <span data-localize='query.single.title'>
                        {tabCaption}
                    </span>
                </a>
            </li>
        );
    }

    onNewAnalysisCancelClick() {

    }

    onSelectAnalysisClick() {

    }

    onDeleteAnalysisClick() {

    }

    onAnalysisNameChange(name) {
        console.log('onAnalysisNameChange', name);
    }

    onAnalysisDescriptionChange(description) {
        console.log('onAnalysisDescriptionChange', description);
    }
}
