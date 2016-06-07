import React from 'react';
import Select from '../../shared/Select';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';


export default class AnalysisRightPane extends React.Component {
    render() {
        return (
            <div>
                {this.renderNewAnalysisTitle()}
                {this.renderAnalysisHeader(this.props.historyItem)}
                <div className='split-scroll form-horizontal'>
                    <div className='form-rows'>
                        <div className='tab-content'>
                            {this.renderAnalysisContent()}
                        </div>
                    </div>
                </div>
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
                {this.renderAnalysisName(historyItem.name)}
                {this.renderAnalysisDates(historyItem.createdDate, historyItem.lastQueryDate)}
                {this.renderAnalysisDescription(historyItem.description)}
                {this.renderAnalysisHeaderTabs()}
            </div>
        );
    }

    renderAnalysisContent() {
        return (
            <div>
                {this.renderSamplesSelects()}
                {this.renderFilterSelector()}
                {this.renderFamilyModelSelector()}
                {this.renderTumorModelSelector()}
                {this.renderViewSelector()}
                <hr className='invisible' />
                {this.renderUseActualVersions()}
                {this.renderAnalyzeButton()}
            </div>
        );
    }

    renderFilterSelector() {
        return (
            <div>
                <h5><span data-localize='general.filter'>Filter</span></h5>
                <div className='form-group'>
                    <div className='col-xs-10 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                onClick={() => this.onFiltersClick()}
                            >
                                <span data-localize='filters.title'>Filters</span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select2-max'>
                            <Select
                                tabIndex='-1'
                                className='select2-search'
                                id='filterSelect'
                                options={this.getFilterOptions()}
                                value={this.props.filtersList.selectedFilterId}
                                onChange={(item) => this.onFilterSelect(item.value)}
                            />
                        </div>
                        <div className='col-xs-2'></div>
                    </div>
                </div>
            </div>
        );
    }
    
    renderFamilyModelSelector() {
        return (
            <div id='familyModelDiv'>
                {this.renderModelSelector()}
            </div>
        );
    }

    renderTumorModelSelector() {
        return (
            <div id='tumorModelDiv'>
                {this.renderModelSelector()}
            </div>
        );
    }

    renderModelSelector() {
        return (
            <div>
                <h5><span data-localize='general.model'>Model</span></h5>
                <div className='form-group'>
                    <div className='col-md-10 col-xs-12 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                type='button'
                                className='btn btn-default btn-fix-width'
                                onClick={() => this.onModelClick()}
                            >
                                <span data-localize='models.title'>Models</span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select2-max'>
                            <Select
                                id='modelSelect'
                                className='select2'
                                tabIndex='-1'
                                value={this.props.modelsList.selectedModelId}
                                options={this.getModelOptions()}
                                onChange={(item) => this.onModelSelect(item.value)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    renderViewSelector() {
        return (
            <div>
                <h5><span data-localize='general.view'>View</span></h5>
                <div className='form-group'>
                    <div className='col-md-10 col-xs-12 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                onClick={() => this.onViewsClick()}
                            >
                                <span data-localize='views.title'>Views</span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select2-max'>
                            <Select
                                tabIndex='-1'
                                className='select2'
                                id='viewSelect'
                                options={this.getViewOptions()}
                                value={this.props.viewsList.selectedViewId}
                                onChange={(item) => this.onViewSelect(item.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelects() {
        return (
            <div className='tab-content'>
                <div className='tab-pane active' id='single'>
                    111
                </div>
                <div className='tab-pane active' role='tabpanel' id='tumorNormal'>
                    222
                    <hr className='invisible' />
                </div>
                <div className='tab-pane active' role='tabpanel' id='family'>
                    333
                    <hr className='invisible' />
                </div>
            </div>
        );
    }

    renderUseActualVersions() {
        return (
            <div className='form-group'>
                <div className='col-sm-6 col-xs-12'>
                    <label className='checkbox checkbox-inline' data-localize='query.reanalyze.help' title='Click for analyze with actual filters and view'>
                        <input
                            type='checkbox'
                            onClick={(e) => this.onUseActionVersionsToggle(e.target.checked)}
                        />
                        <i/> <span data-localize='query.reanalyze.title'>Use actual versions filter, model, view</span>
                    </label>
                </div>
            </div>
        );
    }

    renderAnalyzeButton() {
        return (
            <div className='form-group'>
                <div className='col-xs-12'>
                    <button
                        className='btn btn-primary'
                        title='Click for analyze with analysis initial versions of filter and view'
                        onClick={() => this.onAnalyzeButtonClick()}
                    >
                        <span data-localize='query.analyze.title'>Analyze</span>
                    </button>
                </div>
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

    renderAnalysisName(name) {
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <input
                        value={name}
                        className='form-control material-input-sm material-input-heading text-primary'
                        placeholder="Analysis name (it can't be empty)"
                        data-localize='query.settings.name'
                        onChange={(e) => this.onAnalysisNameChange(e.target.value)}
                    />
                </div>
            </div>
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
    
    renderAnalysisDates(createdDate, lastQueryDate) {
        return (
            <div className='label-date'>
                <label>
                    <span data-localize='general.created_date'>Created date</span>: <span>{createdDate}</span>
                </label>
                <label>
                    <span data-localize='query.last_query_date'>Last query date</span>: <span>{lastQueryDate}</span>
                </label>
            </div>
        );
    }

    renderAnalysisDescription(description) {
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <input
                        value={description}
                        placeholder='Analysis description (optional)'
                        className='form-control material-input-sm'
                        data-localize='query.settings.description'
                        onChange={(e) => this.onAnalysisDescriptionChange(e.target.value)}
                    />
                </div>
            </div>
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

    isViewDisabled(view) {
        const {auth} = this.props;
        return auth.isDemo && view.type == 'advanced';
    }

    getViewOptions() {
        const views = this.props.viewsList.hashedArray.array;
        return views.map(
            (viewItem) => {
                const isDisabled = this.isViewDisabled(viewItem);
                const label = getItemLabelByNameAndType(viewItem.name, viewItem.type);
                return {
                    value: viewItem.id, label, disabled: isDisabled
                };
            }
        );
    }

    isFilterDisabled(filter) {
        const {auth} = this.props;
        return auth.isDemo && filter.type == 'advanced';
    }

    getFilterOptions() {
        const filters = this.props.filtersList.hashedArray.array;
        return filters.map((filterItem) => {
            const isDisabled = this.isFilterDisabled(filterItem);
            const label = getItemLabelByNameAndType(filterItem.name, filterItem.type);
            return {
                value: filterItem.id, label, disabled: isDisabled
            };
        });
    }

    isModelDisabled(model) {
        const {auth} = this.props;
        return auth.isDemo && model.type == 'advanced';
    }

    getModelOptions() {
        const {models} = this.props.modelsList;
        return models.map((sampleItem) => {
            const isDisabled = this.isSampleDisabled(sampleItem);
            const label = getItemLabelByNameAndType(sampleItem.name, sampleItem.type);
            return {value: sampleItem.id, label, disabled: isDisabled};
        });
    }

    isSampleDisabled(sample) {
        const {auth} = this.props;
        return auth.isDemo && sample.type == 'advanced';
    }

    getSampleOptions() {
        const {samples} = this.props.samplesList;
        return samples.map((sampleItem) => {
            const isDisabled = this.isSampleDisabled(sampleItem);
            const label = getItemLabelByNameAndType(sampleItem.fileName, sampleItem.type);
            return {value: sampleItem.id, label, disabled: isDisabled};
        });
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

    onUseActionVersionsToggle(use) {
        console.log('onUseActionVersionsToggle', use);
    }

    onAnalyzeButtonClick() {

    }

    onViewsClick() {

    }

    onViewSelect(viewId) {
        console.log('onViewSelect', viewId);
    }
    
    onFiltersClick() {
        
    }

    onFilterSelect(filterId) {
        console.log('onFilterSelect', filterId);
    }

    onModelClick() {

    }

    onModelSelect(modelId) {
        console.log('onModelSelect', modelId);
    }
}
