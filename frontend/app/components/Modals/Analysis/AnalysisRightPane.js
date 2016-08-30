import React from 'react';
import Select from '../../shared/Select';
import Input from '../../shared/Input';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {
    duplicateQueryHistoryItem,
    cancelQueryHistoryEdit,
    editQueryHistoryItem,
    editExistentQueryHistoryItem,
    updateQueryHistoryItem,
    addQueryHistory
} from '../../../actions/queryHistory';
import {viewBuilderStartEdit, viewBuilderOnSave} from '../../../actions/viewBuilder';
import {filterBuilderStartEdit, filterBuilderOnSave} from '../../../actions/filterBuilder';
import {openModal} from '../../../actions/modalWindows';
import {analyze} from '../../../actions/ui';
import {closeModal} from '../../../actions/modalWindows';
import {samplesOnSave} from '../../../actions/samplesList';
import {entityTypeIsDemoDisabled} from '../../../utils/entityTypes';
import {fetchFields} from '../../../actions/fields';


export default class AnalysisRightPane extends React.Component {

    render() {
        const {historyItem, disabled} = this.props;

        return (
            <div>
                {this.renderNewAnalysisTitle()}
                {historyItem && this.renderAnalysisHeader(historyItem, disabled)}
                <div className='split-scroll form-horizontal'>
                    <div className='form-rows'>
                        {historyItem && this.renderAnalysisContent(historyItem, disabled)}
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

    renderAnalysisHeader(historyItem, disabled) {
        return (
            <div className='split-right-top split-right-top-tabs form-horizontal'>
                {this.renderSelectAnalysis()}
                {this.renderDeleteAnalysis(false)}
                {this.renderAnalysisName(historyItem.name)}
                {this.renderAnalysisDates(historyItem.createdDate, historyItem.lastQueryDate)}
                {this.renderAnalysisDescription(historyItem.description)}
                {this.renderAnalysisHeaderTabs(historyItem.type, disabled)}
            </div>
        );
    }

    renderAnalysisContent(historyItem, disabled) {
        return (
            <div>
                {this.renderSamplesSelects(historyItem, disabled)}
                {this.renderFilterSelector(historyItem.filterId, disabled)}
                {historyItem.type === 'family' && this.renderFamilyModelSelector(historyItem.modelId, disabled)}
                {historyItem.type === 'tumor' && this.renderTumorModelSelector(historyItem.modelId, disabled)}
                {this.renderViewSelector(historyItem.viewId, disabled)}
                <hr className='invisible' />
                {this.renderUseActualVersions()}
                {this.renderAnalyzeButton(!disabled)}
            </div>
        );
    }

    renderFilterSelector(filterId, disabled) {
        return (
            <div>
                <h5><span data-localize='general.filter'>Filter</span></h5>
                <div className='form-group'>
                    <div className='col-xs-10 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
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
                                disabled={disabled}
                                options={this.getFilterOptions()}
                                value={filterId}
                                onChange={(item) => this.onFilterSelect(item.value)}
                            />
                        </div>
                        <div className='col-xs-2'></div>
                    </div>
                </div>
            </div>
        );
    }
    
    renderFamilyModelSelector(modelId, disabled) {
        return (
            <div id='familyModelDiv'>
                {this.renderModelSelector(modelId, disabled)}
            </div>
        );
    }

    renderTumorModelSelector(modelId, disabled) {
        return (
            <div id='tumorModelDiv'>
                {this.renderModelSelector(modelId, disabled)}
            </div>
        );
    }

    renderModelSelector(modelId, disabled) {
        return (
            <div>
                <h5><span data-localize='general.model'>Model</span></h5>
                <div className='form-group'>
                    <div className='col-md-10 col-xs-12 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                type='button'
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
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
                                disabled={disabled}
                                value={modelId}
                                options={this.getModelOptions()}
                                onChange={(item) => this.onModelSelect(item.value)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    renderViewSelector(viewId, disabled) {
        return (
            <div>
                <h5><span data-localize='general.view'>View</span></h5>
                <div className='form-group'>
                    <div className='col-md-10 col-xs-12 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
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
                                disabled={disabled}
                                options={this.getViewOptions()}
                                value={viewId}
                                onChange={(item) => this.onViewSelect(item.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelects(historyItem, disabled) {
        const rendersForType = {
            'single': (historyItem, disabled) => (
                <div className='tab-pane active' id='single'>
                     {this.renderSampleSelectSingle(historyItem.samples[0], disabled)}
                </div>
            ),
            'tumor': (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel' id='tumorNormal'>
                     {this.renderSamplesSelectsTumorNormalHeader()}
                     {this.renderSamplesSelectsTumorNormalSampleTumor(historyItem.samples[0], disabled)}
                     {this.renderSamplesSelectsTumorNormalSampleNormal(historyItem.samples[1], disabled)}
                     <hr className='invisible' />
                </div>
            ),
            'family': (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel' id='family'>
                     {this.renderSamplesSelectsFamilyHeader()}
                     {historyItem.samples.map( (sample, i) =>
                         sample.type === 'proband' ?
                             this.renderSamplesSelectsFamilyProband(sample, disabled, i) :
                             this.renderSamplesSelectsFamilyMember(sample, disabled, i)
                     )}
                     <hr className='invisible' />
                </div>
            )
        };

        const typeRender = rendersForType[historyItem.type];
        console.log(historyItem);
        return (
            <div className='tab-content'>
                {typeRender && typeRender(historyItem, disabled)}
            </div>
        );
    }

    renderSampleSelectSingle(sample, disabled) {
        return (
            <div>
                <h5><span data-localize='general.sample'>Sample</span></h5>
                <div className='form-group'>
                    <div className='col-xs-10 btn-group-select2'>
                        <div className='btn-group'>
                            <button
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
                                onClick={() => this.onSamplesClick(0)}
                            >
                                <span data-localize='samples.title'>Samples</span>
                            </button>
                        </div>

                        <div className='btn-group btn-group btn-group-left'>
                            <label className='label label-dark-default label-fix-width label-left'>
                                <span data-localize='query.single.title'>Single</span>
                            </label>
                        </div>
                        <div className='btn-group btn-group-select2-max btn-group-right'>
                            <Select
                                className='select2-search select-right'
                                tabindex='-1'
                                disabled={disabled}
                                value={sample && sample.id || null}
                                options={this.getSampleOptions()}
                                onChange={(item) => this.onSampleSelect(0, item.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelectsTumorNormalHeader() {
        return (
            <h5><span data-localize='samples.title'>Samples</span></h5>
        );
    }

    renderSamplesSelectsTumorNormalSampleTumor(sample, disabled) {
        return (
            <div className='form-group'>
                <div className='col-xs-10 btn-group-select2 '>
                    <div className='btn-group'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(0)}
                        >
                            <span data-localize='samples.title'>Samples</span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-left'>
                        <label className='label label-dark-default  label-fix-width label-left'>
                            <span data-localize='query.tumor_normal.tumor.title'>Tumor</span>
                        </label>
                    </div>
                    <div className='btn-group btn-group-select2-max'>
                        <Select
                            className='select2-search'
                            tabindex='-1'
                            disabled={disabled}
                            value={sample && sample.id || null}
                            options={this.getSampleOptions()}
                            onChange={(item) => this.onSampleSelect(0, item.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelectsTumorNormalSampleNormal(sample, disabled) {
        return (
            <div className='form-group'>
                <div className='col-xs-10 btn-group-select2 '>
                    <div className='btn-group'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(1)}
                        >
                            <span data-localize='samples.title'>Samples</span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-left'>
                        <label className='label label-default  label-fix-width label-left'>
                            <span data-localize='query.tumor_normal.normal.title'>Normal</span>
                        </label>
                    </div>
                    <div className='btn-group btn-group-select2-max btn-group-right'>
                        <Select
                            tabindex='-1'
                            className='select2-search select-right'
                            disabled={disabled}
                            value={sample && sample.id || null}
                            options={this.getSampleOptions()}
                            onChange={(item) => this.onSampleSelect(1, item.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelectsFamilyHeader() {
        return (
            <h5><span data-localize='samples.title'>Samples</span></h5>
        );
    }

    renderSamplesSelectsFamilyProband(sample, disabled, i) {
        return (
            <div className='form-group' key={i}>
                <div className='col-xs-10 btn-group-select2'>
                    <div className='btn-group'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(0)}
                        >
                            <span data-localize='samples.title'>Samples</span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-left'>
                        <label className='label label-dark-default label-fix-width label-left'>
                            <span data-localize='query.family.proband.title'>Proband</span>
                        </label>
                    </div>
                    <div className='btn-group btn-group-select2-max btn-group-right'>
                        <Select
                            className='select2-search select-right'
                            tabindex='-1'
                            disabled={disabled}
                            value={sample && sample.id || null}
                            options={this.getSampleOptions()}
                            onChange={(item) => this.onSampleSelect(0, item.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelectsFamilyMember(sample, disabled, i) {

        const familyMemberLabel = {
            'mother': 'M',
            'father': 'F'
        };

        return (
            <div className='form-group' key={i}>
                <div className='col-xs-10 btn-group-select2'>
                    <div className='btn-group'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(i)}
                        >
                            <span data-localize='samples.title'>Samples</span>
                        </button>
                    </div>
                    <div className='btn-group'>
                        <label className='label label-default label-fix-width'>
                            <span data-localize='query.family.mother.short'>{sample && familyMemberLabel[sample.type] || ''}</span>
                        </label>
                    </div>
                    <div className='btn-group btn-group-select2-max'>
                        <Select
                            aria-hidden='true'
                            tabindex='-1'
                            className='select2-search select2-right select2-right form-control'
                            disabled={disabled}
                            value={sample && sample.id || null}
                            options={this.getSampleOptions()}
                            onChange={(item) => this.onSampleSelect(i, item.value)}
                        />
                    </div>
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

    renderAnalyzeButton(isEditing) {
        return (
            <div className='form-group'>
                <div className='col-xs-12'>
                    {
                        isEditing ?
                            <button
                                className='btn btn-primary'
                                title='Click for cancel'
                                onClick={() => this.onCancelButtonClick()}
                            >
                                <span>Cancel</span>
                            </button>
                            :
                            <button
                                className='btn btn-primary'
                                title='Click for edit'
                                onClick={() => this.onDuplicateButtonClick()}
                            >
                                <span>Duplicate</span>
                            </button>
                    }
                    <button
                        className='btn btn-primary'
                        title='Click for analyze with analysis initial versions of filter and view'
                        onClick={() => this.onAnalyzeButtonClick(isEditing)}
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

    renderDeleteAnalysis(disabled) {
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                disabled={disabled}
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
                    <Input
                        value={name}
                        className='form-control material-input-sm material-input-heading text-primary'
                        placeholder="Analysis name (it can't be empty)"
                        data-localize='query.settings.name'
                        maxLength={50}
                        onChange={(str) => this.onAnalysisNameChange(str)}
                    />
                </div>
            </div>
        );
    }

    renderAnalysisHeaderTabs(historyItemType, disabled) {
        const tabs = [
            {
                isActive: historyItemType === 'single',
                className: 'single-tab',
                caption: 'Single',
                onSelect: () => this.props.dispatch(this.actionEdit({type: 'single'}))
            },
            {
                isActive: historyItemType === 'tumor',
                className: 'tumor-normal-tab',
                caption: 'Tumor/Normal',
                onSelect: () => this.props.dispatch(this.actionEdit({type: 'tumor'}))
            },
            {
                isActive: historyItemType === 'family',
                className: 'family-tab',
                caption: 'Family',
                onSelect: () => this.props.dispatch(this.actionEdit({type: 'family'}))
            }
        ];
        return (
            <ul role='tablist' className='nav nav-tabs' id='analisisTypes'>
                {tabs.filter((tab) => tab.isActive || !disabled).map((tab) => this.renderAnalysisHeaderTab(tab.isActive, tab.className, tab.caption, tab.onSelect))}
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
                    <Input
                        value={description}
                        placeholder='Analysis description (optional)'
                        className='form-control material-input-sm'
                        data-localize='query.settings.description'
                        onChange={(str) => this.onAnalysisDescriptionChange(str)}
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
        return entityTypeIsDemoDisabled(view.type, this.props.auth.isDemo);
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
        return entityTypeIsDemoDisabled(filter.type, this.props.auth.isDemo);
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
        return entityTypeIsDemoDisabled(model.type, this.props.auth.isDemo);
    }

    getModelOptions() {
        const models = this.props.modelsList.hashedArray.array;
        return models.map((sampleItem) => {
            const isDisabled = this.isModelDisabled(sampleItem);
            const label = getItemLabelByNameAndType(sampleItem.name, sampleItem.type);
            return {value: sampleItem.id, label, disabled: isDisabled};
        });
    }

    isSampleDisabled(sample) {
        return entityTypeIsDemoDisabled(sample.type, this.props.auth.isDemo);
    }

    getSampleOptions() {
        const samples = this.props.samplesList.hashedArray.array;
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
        console.log('onAnalysisNameChange', name, this.props.historyItem);
        if (this.props.historyItem.id) {
            this.props.dispatch(editExistentQueryHistoryItem({...this.props.historyItem, name}));
            this.props.dispatch(updateQueryHistoryItem(this.props.historyItem.id));
        } else {
            this.props.dispatch(this.actionEdit({name}));
        }
    }

    onAnalysisDescriptionChange(description) {
        console.log('onAnalysisDescriptionChange', description);
        if (this.props.historyItem.id) {
            this.props.dispatch(editExistentQueryHistoryItem({...this.props.historyItem, description}));
            this.props.dispatch(updateQueryHistoryItem(this.props.historyItem.id));
        } else {
            this.props.dispatch(this.actionEdit({description}));
        }
    }

    onUseActionVersionsToggle(use) {
        console.log('onUseActionVersionsToggle', use);
    }

    onDuplicateButtonClick() {
        this.props.dispatch(duplicateQueryHistoryItem(this.props.historyItem.id));
    }

    onCancelButtonClick() {
        this.props.dispatch(cancelQueryHistoryEdit());
    }

    onAnalyzeButtonClick(isEditing) {
        const {dispatch, historyItem, currentItemId} = this.props;
        dispatch(analyze({
            id: isEditing ? null : currentItemId,
            name: historyItem.name,
            description: historyItem.description,
            type: historyItem.type,
            samples: historyItem.samples,
            viewId: historyItem.viewId,
            filterId: historyItem.filterId,
            modelId: historyItem.modelId
        })).then((analysis) => {
            if (isEditing && analysis) {
                dispatch(cancelQueryHistoryEdit());
                dispatch(addQueryHistory(analysis));
            }
        });
        dispatch(closeModal('analysis'));
    }

    onViewsClick() {
        const {historyItem, viewsList} = this.props;
        this.props.dispatch(viewBuilderStartEdit(false, viewsList.hashedArray.hash[historyItem.viewId]));
        const action = this.actionEdit({viewId: null});
        this.props.dispatch(viewBuilderOnSave(action, 'changeItem.viewId'));
        this.props.dispatch(openModal('views'));
    }

    onViewSelect(viewId) {
        this.props.dispatch(this.actionEdit({viewId: viewId}));
    }
    
    onFiltersClick() {
        const {historyItem, filtersList} = this.props;
        this.props.dispatch(filterBuilderStartEdit(false, filtersList.hashedArray.hash[historyItem.filterId], this.props.fields, 'filter', filtersList));
        const action = this.actionEdit({filterId: null});
        this.props.dispatch(filterBuilderOnSave(action, 'changeItem.filterId'));
        this.props.dispatch(openModal('filters'));
    }

    onFilterSelect(filterId) {
        this.props.dispatch(this.actionEdit({filterId: filterId}));
    }

    onModelClick() {
        const {historyItem, modelsList} = this.props;
        this.props.dispatch(filterBuilderStartEdit(false, modelsList.hashedArray.hash[historyItem.modelId], this.props.fields, 'model', modelsList));
        const action = this.actionEdit({modelId: null});
        this.props.dispatch(filterBuilderOnSave(action, 'changeItem.modelId'));
        this.props.dispatch(openModal('filters'));
    }

    onModelSelect(modelId) {
        this.props.dispatch(this.actionEdit({modelId: modelId}));
    }
    
    onSamplesClick(sampleIndex) {
        const action = this.actionEdit({sample: {index: sampleIndex, id: null}});
        this.props.dispatch(samplesOnSave(action, 'changeItem.sample.id'));
        this.props.dispatch(openModal('upload'));
    }
    
    onSampleSelect(sampleIndex, sampleId) {
        this.props.dispatch(this.actionEdit({sample: {index: sampleIndex, id: sampleId}}));
        if (!sampleIndex) {
            this.props.dispatch(fetchFields(sampleId)); // TODO check if fetched correctly
        }
    }

    actionEdit(change) {
        const {samplesList, filtersList, viewsList, modelsList} = this.props;
        return editQueryHistoryItem(
            samplesList,
            filtersList,
            viewsList,
            modelsList,
            change
        );
    }
}
