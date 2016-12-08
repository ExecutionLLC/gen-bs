import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import Select from '../../shared/Select';
import Input from '../../shared/Input';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {
    duplicateAnalysesHistoryItem,
    createNewHistoryItem,
    editAnalysesHistoryItem,
    editExistentAnalysesHistoryItem,
    updateAnalysesHistoryItemAsync,
    setEditedHistoryItem,
    deleteServerAnalysesHistoryItemAsync
} from '../../../actions/analysesHistory';
import {viewBuilderStartEdit, viewBuilderOnSave} from '../../../actions/viewBuilder';
import {filterBuilderStartEdit, filterBuilderOnSave} from '../../../actions/filterBuilder';
import {
    openModal,
    closeModal
} from '../../../actions/modalWindows';
import {analyze} from '../../../actions/ui';
import {samplesOnSave} from '../../../actions/samplesList';
import {entityTypeIsDemoDisabled} from '../../../utils/entityTypes';
import FieldUtils from '../../../utils/fieldUtils';
import {sampleType, sampleTypesForAnalysisType, typeLabels, makeSampleLabel} from '../../../utils/samplesUtils';
import {analysisType} from '../../../utils/analyseUtils';
import {getDefaultOrStandardItem} from '../../../utils/entityTypes';
import {ImmutableHashedArray} from '../../../utils/immutable';
import CompoundHeterozygousModelRule from './rules/CompHeterModelRule';


// TODO class contains many similar and unused functions, refactor there with updated layout

export default class AnalysisRightPane extends React.Component {

    render() {
        const {historyItem, disabled, auth: {isDemo}, isBringToFront} = this.props;

        return (
            <div className={classNames({'split-right': true, 'bring-to-front': isBringToFront})}>
                {historyItem && this.renderAnalysisHeader(historyItem, disabled, isDemo)}
                <div className='split-scroll'>
                    <div className='form-padding'>
                        {!disabled ?
                            <div className='form-rows  form-rows-xsicons'>
                                {historyItem && this.renderAnalysisContent(historyItem)}
                            </div>
                            :
                            this.renderDisabledAnalysis(historyItem)
                        }
                    </div>
                </div>
            </div>
        );
    }


    renderAnalysisHeader(historyItem, disabled, isDemo) {
        return (
            <div className='split-top'>
                <div className='form-horizontal form-padding'>
                    {historyItem.id && this.renderDeleteAnalysisButton()}
                    {this.renderAnalysisName(historyItem.name, isDemo)}
                    {this.renderAnalysisDates(historyItem.createdDate, historyItem.lastQueryDate)}
                    {this.renderAnalysisDescription(historyItem.description, isDemo)}
                </div>
                {!disabled && this.renderAnalysisHeaderTabs(historyItem.type, disabled)}
            </div>
        );
    }

    renderAnalysisContent(historyItem) {
        return (
            <div>
                {this.renderSamplesSelects(historyItem, false)}
                {this.renderFilterSelector(historyItem.filterId, false)}
                {historyItem.type === analysisType.FAMILY && this.renderFamilyModelSelector(historyItem.modelId, false)}
                {historyItem.type === analysisType.TUMOR && this.renderTumorModelSelector(historyItem.modelId, false)}
                {this.renderViewSelector(historyItem.viewId, false)}
                <hr className='invisible' />
                {this.renderAnalyzeButton()}
            </div>
        );
    }

    renderFilterSelector(filterId, disabled) {
        return (
            <div>
                <h5><span data-localize='general.filter'>Filter</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group'>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
                                onClick={() => this.onFiltersClick()}
                            >
                                <span className='text-muted' data-localize='filters.title'>Filters</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
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
                    <div className='col-xs-12 col-md-10 btn-group-select-group '>
                        <div className='btn-group btn-group-icon'>
                            <button
                                type='button'
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
                                onClick={() => this.onModelClick()}
                            >
                                <span className='text-muted' data-localize='models.title'>Models</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
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
                    <div className='col-xs-12 col-md-10 btn-group-select-group '>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
                                onClick={() => this.onViewsClick()}
                            >
                                <span className='text-muted' data-localize='views.title'>Views</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
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

        const selectedSamplesHash = _.keyBy(historyItem.samples, (sample) => sample.id);

        const rendersForType = {
            [analysisType.SINGLE]: (historyItem, disabled) => (
                <div className='tab-pane active' id='single'>
                     {this.renderSampleSelectSingle(historyItem.samples[0], disabled, selectedSamplesHash)}
                </div>
            ),
            [analysisType.TUMOR]: (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel' id='tumorNormal'>
                     {this.renderSamplesSelectsTumorNormalHeader()}
                     {this.renderSamplesSelectsTumorNormalSampleTumor(historyItem.samples[0], disabled, selectedSamplesHash)}
                     {this.renderSamplesSelectsTumorNormalSampleNormal(historyItem.samples[1], disabled, selectedSamplesHash)}
                     <hr className='invisible' />
                </div>
            ),
            [analysisType.FAMILY]: (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel' id='family'>
                     {this.renderSamplesSelectsFamilyHeader()}
                     {historyItem.samples.map( (sample, i) =>
                         sample.type === sampleType.PROBAND ?
                             this.renderSamplesSelectsFamilyProband(sample, disabled, i, selectedSamplesHash) :
                             this.renderSamplesSelectsFamilyMember(sample, disabled, i, selectedSamplesHash)
                     )}
                     <hr className='invisible' />
                </div>
            )
        };

        const typeRender = rendersForType[historyItem.type];
        return (
            <div className='tab-content'>
                {typeRender && typeRender(historyItem, disabled)}
            </div>
        );
    }

    renderSampleSelectSingle(sample, disabled, selectedSamplesHash) {
        const value = sample ? sample.id : null;

        return (
            <div>
                <h5><span data-localize='general.sample'>Sample</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group'>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
                                onClick={() => this.onSamplesClick(0)}
                            >
                                <span className='text-muted' data-localize='samples.title'>Samples</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>

                        <div className='btn-group btn-group-select-group-max'>
                            <Select
                                className='select2-search select-right'
                                tabindex='-1'
                                disabled={disabled}
                                value={value}
                                options={this.getSampleOptions(value, selectedSamplesHash)}
                                onChange={(item) => this.onSampleSelect(0, item.value)}
                            />
                        </div>
                        <div className='btn-group-prefix'>
                            <label className='label label-dark-default label-round'>
                                <span data-localize='query.single.title'>S</span>
                            </label>
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

    renderSamplesSelectsTumorNormalSampleTumor(sample, disabled, selectedSamplesHash) {
        const value = sample ? sample.id : null;

        return (
            <div className='form-group'>
                <div className='col-xs-12 col-md-10 btn-group-select-group '>
                    <div className='btn-group btn-group-icon'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(0)}
                        >
                                <span className='text-muted' data-localize='samples.title'>Samples</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-select-group-max'>
                        <Select
                            className='select2-search'
                            tabindex='-1'
                            disabled={disabled}
                            value={value}
                            options={this.getSampleOptions(value, selectedSamplesHash)}
                            onChange={(item) => this.onSampleSelect(0, item.value)}
                        />
                    </div>
                    <div className='btn-group-prefix'>
                        <label className='label label-dark-default label-round'>
                            <span data-localize='query.tumor_normal.tumor.title'>T</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderSamplesSelectsTumorNormalSampleNormal(sample, disabled, selectedSamplesHash) {
        const value = sample ? sample.id : null;

        return (
            <div className='form-group'>
                <div className='col-xs-12 col-md-10 btn-group-select-group '>
                    <div className='btn-group btn-group-icon'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(1)}
                        >
                                <span className='text-muted' data-localize='samples.title'>Samples</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-select-group-max'>
                        <Select
                            tabindex='-1'
                            className='select2-search select-right'
                            disabled={disabled}
                            value={value}
                            options={this.getSampleOptions(value, selectedSamplesHash)}
                            onChange={(item) => this.onSampleSelect(1, item.value)}
                        />
                    </div>
                    <div className='btn-group-prefix'>
                        <label className='label label-default label-round'>
                            <span data-localize='query.tumor_normal.normal.title'>N</span>
                        </label>
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

    renderSamplesSelectsFamilyProband(sample, disabled, i, selectedSamplesHash) {
        const value = sample ? sample.id : null;

        return (
            <div className='form-group' key={i}>
                <div className='col-xs-12 col-md-10 btn-group-select-group '>
                    <div className='btn-group btn-group-icon'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(0)}
                        >
                                <span className='text-muted' data-localize='samples.title'>Samples</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-select-group-max btn-group-right'>
                        <Select
                            className='select2-search select-right'
                            tabindex='-1'
                            disabled={disabled}
                            value={value}
                            options={this.getSampleOptions(value, selectedSamplesHash)}
                            onChange={(item) => this.onSampleSelect(0, item.value)}
                        />
                    </div>
                    <div className='btn-group-prefix'>
                        <label className='label label-default label-round'>
                            <span data-localize='query.family.proband.title'>P</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderSamplesSelectsFamilyMember(sample, disabled, i, selectedSamplesHash) {
        const value = sample ? sample.id : null;

        return (
            <div className='form-group' key={i}>
                <div className='col-xs-12 col-md-10 btn-group-select-group '>
                    <div className='btn-group btn-group-icon'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(i)}
                        >
                                <span className='text-muted' data-localize='samples.title'>Samples</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                        </button>
                    </div>
                    <div className='btn-group btn-group-select-group-max btn-group-right'>
                        <Select
                            aria-hidden='true'
                            tabindex='-1'
                            className='select2-search select-right'
                            disabled={disabled}
                            value={value}
                            options={this.getSampleOptions(value, selectedSamplesHash)}
                            onChange={(item) => this.onSampleSelect(i, item.value)}
                        />
                    </div>
                    <div className='btn-group-prefix'>
                        <label className='label label-default label-round'>
                            <span data-localize='query.family.mother.short'>{sample ? typeLabels[sample.type] : ''}</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderAnalyzeButton() {
        const {historyItem, modelsList, fields, samplesList} = this.props;
        const validationRules = [
            new CompoundHeterozygousModelRule({
                historyItem,
                modelsList,
                fields,
                samplesList
            })
        ];
        const validationResults = _.map(validationRules, rule => rule.validate());
        const error = _.find(validationResults, {isValid: false});
        const buttonParams = {
            title: error ? error.errorMessage : 'Click for analyze with analysis initial versions of filter and view',
            disabled: error ? true : false
        };
        return (
            <div className='btn-toolbar btn-toolbar-form-actions'>
                <button
                    className='btn btn-primary'
                    disabled={buttonParams.disabled}
                    title={buttonParams.title}
                    onClick={() => this.onAnalyzeButtonClick(true)}
                >
                    <span data-localize='query.analyze.title'>Analyze</span>
                </button>
                <a
                    type='button'
                    className='btn btn-link btn-uppercase'
                    onClick={() => this.onCancelButtonClick()}
                ><span>Restore to default</span></a>
            </div>
        );
    }

    renderDeleteAnalysisButton() {
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                onClick={() => this.onDeleteAnalysisClick()}
            >
                <span data-localize='query.delete_analysis'>Delete analysis</span>
            </button>
        );
    }

    renderAnalysisName(name, disabled) {
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={name}
                        disabled={disabled}
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

    analysisTypeCaption(type) {
        return {
            [analysisType.SINGLE]: 'Single',
            [analysisType.TUMOR]: 'Tumor/Normal',
            [analysisType.FAMILY]: 'Family'
        }[type] || '';
    }

    sampleTypeCaption(type) {
        return {
            [sampleType.SINGLE]: 'Single',
            [sampleType.TUMOR]: 'Tumor',
            [sampleType.NORMAL]: 'Normal',
            [sampleType.PROBAND]: 'Proband',
            [sampleType.MOTHER]: 'Mother',
            [sampleType.FATHER]: 'Father'
        }[type] || '';
    }

    renderAnalysisHeaderTabs(historyItemType, disabled) {
        const {dispatch} = this.props;
        const tabs = [
            {
                isActive: historyItemType === analysisType.SINGLE,
                className: 'single-tab',
                caption: this.analysisTypeCaption(analysisType.SINGLE),
                onSelect: () => dispatch(this.actionEdit({type: analysisType.SINGLE}))
            },
            {
                isActive: historyItemType === analysisType.TUMOR,
                className: 'tumor-normal-tab',
                caption: this.analysisTypeCaption(analysisType.TUMOR),
                onSelect: () => dispatch(this.actionEdit({type: analysisType.TUMOR}))
            },
            {
                isActive: historyItemType === analysisType.FAMILY,
                className: 'family-tab',
                caption: this.analysisTypeCaption(analysisType.FAMILY),
                onSelect: () => dispatch(this.actionEdit({type: analysisType.FAMILY}))
            }
        ];
        return (
            <ul role='tablist' className='nav nav-tabs' id='analisisTypes'>
                {disabled && <li className='pull-right text-muted'>Duplicate to make changes</li>}
                {tabs.filter((tab) => tab.isActive || !disabled).map((tab) => this.renderAnalysisHeaderTab(tab.isActive, tab.className, tab.caption, tab.onSelect))}
            </ul>
        );
    }
    
    renderAnalysisDates(createdDate, lastQueryDate) {
        return (
            <div className='label-group-date'>
                <label>
                    <span data-localize='general.created_date'>Created date</span>: <span>{createdDate}</span>
                </label>
                <label>
                    <span data-localize='query.last_query_date'>Updated</span>: <span>{lastQueryDate}</span>
                </label>
            </div>
        );
    }

    renderAnalysisDescription(description, disabled) {
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={description}
                        disabled={disabled}
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

    renderDisabledAnalysis(historyItem) {
        const {
            samplesList: {hashedArray: {hash: samplesHash}},
            filtersList: {hashedArray: {hash: filtersHash}},
            modelsList: {hashedArray: {hash: modelsHash}},
            viewsList: {hashedArray: {hash: viewsHash}}
        } = this.props;

        const selectedFilter = filtersHash[historyItem.filterId];
        const selectedModel = historyItem.modelId && modelsHash[historyItem.modelId];
        const selectedView = viewsHash[historyItem.viewId];

        return (
            <div className='dl-group-view-mode'>
                <dl>
                    <dt>Analysis type</dt>
                    <dd>{this.analysisTypeCaption(historyItem.type)}</dd>
                </dl>
                {historyItem.samples.map((sampleInfo) => {
                    const sampleId = sampleInfo.id;
                    const sample = samplesHash[sampleId];

                    return (
                        <dl key={sampleId}>
                            <dt><span data-localize='general.sample'>Sample</span>
                                ({this.sampleTypeCaption(sampleInfo.type)})
                            </dt>
                            <dd>{sample && getItemLabelByNameAndType(makeSampleLabel(sample), sample.type)}</dd>
                        </dl>
                    );
                })}
                <dl>
                    <dt>Filter</dt>
                    <dd>{selectedFilter && getItemLabelByNameAndType(selectedFilter.name, selectedFilter.type)}</dd>
                </dl>
                {historyItem.modelId &&
                    <dl>
                        <dt>Model</dt>
                        <dd>{selectedModel && getItemLabelByNameAndType(selectedModel.name, selectedModel.type)}</dd>
                    </dl>
                }
                <dl>
                    <dt>View</dt>
                    <dd>{selectedView && getItemLabelByNameAndType(selectedView.name, selectedView.type)}</dd>
                </dl>

                <hr />
                <div className='btn-toolbar btn-toolbar-form-actions'>
                    <a
                       type='button'
                       className='btn btn-link btn-uppercase'
                       onClick={() => this.onDuplicateButtonClick()}
                    ><span>Duplicate</span></a>

                    <a
                        className='btn btn-link btn-uppercase'
                        role='button'
                        onClick={() => this.onAnalyzeButtonClick(false)}
                    >
                        <span>View results</span>
                    </a>
                </div>
            </div>
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
        const {modelsList, historyItem} = this.props;
        const models = modelsList.hashedArray.array;
        return models
            .filter((model) => model.analysisType === historyItem.type)
            .map((sampleItem) => {
                const isDisabled = this.isModelDisabled(sampleItem);
                const label = getItemLabelByNameAndType(sampleItem.name, sampleItem.type);
                return {value: sampleItem.id, label, disabled: isDisabled};
            });
    }

    isSampleDisabled(sample) {
        return entityTypeIsDemoDisabled(sample.type, this.props.auth.isDemo);
    }

    getSampleOptions(value, selectedSamplesHash) {
        const samples = this.props.samplesList.hashedArray.array;
        return samples.map((sampleItem) => {
            const isDisabled = sampleItem.id !== value && (this.isSampleDisabled(sampleItem) || !!selectedSamplesHash[sampleItem.id] || _.isEmpty(sampleItem.sampleFields));
            const {type: sampleType, id: sampleId} = sampleItem;
            const sampleName = makeSampleLabel(sampleItem);
            const label = getItemLabelByNameAndType(sampleName, sampleType);
            return {value: sampleId, label, disabled: isDisabled};
        });
    }

    onDeleteAnalysisClick() {
        const {dispatch, historyItem: {id: historyItemId}} = this.props;
        if (historyItemId) {
            dispatch(deleteServerAnalysesHistoryItemAsync(historyItemId));
        }
    }

    onAnalysisNameChange(name) {
        const {dispatch, historyItem} = this.props;
        if (!name) {
            return;
        }
        if (historyItem.id) {
            dispatch(editExistentAnalysesHistoryItem({...historyItem, name}));
            dispatch(updateAnalysesHistoryItemAsync(historyItem.id));
        } else {
            dispatch(this.actionEdit({name}));
        }
    }

    onAnalysisDescriptionChange(description) {
        const {dispatch, historyItem} = this.props;
        if (historyItem.id) {
            dispatch(editExistentAnalysesHistoryItem({...historyItem, description}));
            dispatch(updateAnalysesHistoryItemAsync(historyItem.id));
        } else {
            dispatch(this.actionEdit({description}));
        }
    }

    onDuplicateButtonClick() {
        const {dispatch, historyItem} = this.props;
        dispatch(duplicateAnalysesHistoryItem(historyItem));
    }

    onCancelButtonClick() {
        const {
            dispatch,
            samplesList: {hashedArray: {array: samples}},
            viewsList: {hashedArray: {array: views}},
            filtersList: {hashedArray: {array: filters}}
        } = this.props;
        const sample = getDefaultOrStandardItem(samples);
        const filter = getDefaultOrStandardItem(filters);
        const view = getDefaultOrStandardItem(views);
        dispatch(createNewHistoryItem(sample, filter, view));
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
                dispatch(setEditedHistoryItem(analysis));
            } else if (analysis) {
                dispatch(editExistentAnalysesHistoryItem(analysis));
            }
        });
        dispatch(closeModal('analysis'));
    }

    onViewsClick() {
        const {dispatch, historyItem, viewsList, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        const samples = _.map(historyItem.samples, (sampleInfo) => samplesHash[sampleInfo.id]);
        const allowedFields = FieldUtils.makeViewFilterAllowedFields(samples, fields.totalFieldsHashedArray.hash, fields.sourceFieldsList);
        dispatch(viewBuilderStartEdit(false, viewsList.hashedArray.hash[historyItem.viewId], allowedFields));
        const action = this.actionEdit({viewId: null});
        dispatch(viewBuilderOnSave(action, 'changeItem.viewId'));
        dispatch(openModal('views'));
    }

    onViewSelect(viewId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({viewId: viewId}));
    }
    
    onFiltersClick() {
        const {dispatch, historyItem, filtersList, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        const mainSample = samplesHash[historyItem.samples[0].id];
        const allowedFields = FieldUtils.makeViewFilterAllowedFields([mainSample], fields.totalFieldsHashedArray.hash, fields.sourceFieldsList);
        const filterFiltersStrategy = {name: 'filter'};
        dispatch(filterBuilderStartEdit(false, filtersList.hashedArray.hash[historyItem.filterId], fields, allowedFields, filterFiltersStrategy, filtersList));
        const action = this.actionEdit({filterId: null});
        dispatch(filterBuilderOnSave(action, 'changeItem.filterId'));
        dispatch(openModal('filters'));
    }

    onFilterSelect(filterId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({filterId: filterId}));
    }

    onModelClick() {
        const {dispatch, historyItem, modelsList, samplesList: {hashedArray: {hash: samplesHash}}, fields} = this.props;
        const samples = _.map(historyItem.samples, (sampleInfo) => samplesHash[sampleInfo.id]);
        const samplesTypes = _.reduce(
            sampleTypesForAnalysisType[historyItem.type],
            (hash, sampleType, index) => ({
                ...hash,
                [historyItem.samples[index].id]: sampleType
            }),
            {}
        );
        const allowedFields = FieldUtils.makeModelAllowedFields(samples, samplesTypes, fields.totalFieldsHashedArray.hash);
        const modelFiltersStrategy = {name: 'model', analysisType: historyItem.type};
        const analysisTypeModelsList = {
            ...modelsList,
            hashedArray: ImmutableHashedArray.makeFromArray(modelsList.hashedArray.array.filter((model) => model.analysisType === historyItem.type))
        };
        dispatch(filterBuilderStartEdit(false, modelsList.hashedArray.hash[historyItem.modelId], fields, allowedFields, modelFiltersStrategy, analysisTypeModelsList));
        const action = this.actionEdit({modelId: null});
        dispatch(filterBuilderOnSave(action, 'changeItem.modelId'));
        dispatch(openModal('filters'));
    }

    onModelSelect(modelId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({modelId: modelId}));
    }
    
    onSamplesClick(sampleIndex) {
        const {dispatch, historyItem} = this.props;
        const selectedSamplesIds = _.map(historyItem.samples, (sample) => sample.id);
        const action = this.actionEdit({sample: {index: sampleIndex, id: selectedSamplesIds[sampleIndex]}});
        dispatch(samplesOnSave(selectedSamplesIds, action, 'changeItem.sample.index', 'changeItem.sample.id'));
        dispatch(openModal('upload'));
    }
    
    onSampleSelect(sampleIndex, sampleId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({sample: {index: sampleIndex, id: sampleId}}));
    }

    actionEdit(change) {
        const {samplesList, modelsList, auth: {isDemo}} = this.props;
        return editAnalysesHistoryItem(
            samplesList,
            modelsList,
            isDemo,
            change
        );
    }
}
