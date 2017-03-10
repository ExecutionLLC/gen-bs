import _ from 'lodash';
import classNames from 'classnames';
import React, {PropTypes} from 'react';
import Select from '../../shared/Select';
import Input from '../../shared/Input';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {formatDate} from './../../../utils/dateUtil';
import * as HistoryItemUtils from '../../../utils/HistoryItemUtils';
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
import {filterBuilderStartEdit, filterBuilderOnSave, filterBuilderStrategyName} from '../../../actions/filterBuilder';
import {
    openModal,
    closeModal,
    modalName
} from '../../../actions/modalWindows';
import {analyze} from '../../../actions/ui';
import {samplesOnSave} from '../../../actions/samplesList';
import {entityTypeIsDemoDisabled} from '../../../utils/entityTypes';
import FieldUtils from '../../../utils/fieldUtils';
import {sampleType, sampleTypesForAnalysisType} from '../../../utils/samplesUtils';
import {analysisType} from '../../../utils/analyseUtils';
import {getDefaultOrStandardItem} from '../../../utils/entityTypes';
import {ImmutableHashedArray} from '../../../utils/immutable';
import CompoundHeterozygousModelRule from './rules/CompHeterModelRule';
import config from '../../../../config';
import {SAMPLE_UPLOAD_STATE} from '../../../actions/fileUpload';
import * as i18n from '../../../utils/i18n';


// TODO class contains many similar and unused functions, refactor there with updated layout

export default class AnalysisRightPane extends React.Component {

    render() {
        const {historyItem, disabled, isBringToFront} = this.props;

        return (
            <div className={classNames('split-right', {'bring-to-front': isBringToFront})}>
                {historyItem && this.renderAnalysisHeader(historyItem, disabled)}
                <div className='split-scroll'>
                    <div className='form-padding'>
                        {!disabled ?
                            <div className='form-rows form-rows-xsicons'>
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


    renderAnalysisHeader(historyItem, disabled) {
        const {auth: {isDemo}, ui: {languageId}} = this.props;

        return (
            <div className='split-top'>
                <div className='form-horizontal form-padding'>
                    {historyItem.id && this.renderDeleteAnalysisButton()}
                    {this.renderAnalysisName(i18n.getEntityText(historyItem, languageId).name, isDemo)}
                    {this.renderAnalysisDates(historyItem.createdDate)}
                    {this.renderAnalysisDescription(i18n.getEntityText(historyItem, languageId).description, isDemo)}
                </div>
                {!disabled && this.renderAnalysisHeaderTabs(historyItem.type)}
            </div>
        );
    }

    renderAnalysisContent(historyItem) {
        return (
            <div>
                {this.renderSamplesSelects(historyItem)}
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
        const {p} = this.props;
        return (
            <div>
                <h5><span>{p.t('analysis.rightPane.content.filter')}</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group'>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
                                onClick={() => this.onFiltersClick()}
                            >
                                <span className='text-muted'>{p.t('analysis.rightPane.content.filters')}</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
                            <Select
                                tabIndex='-1'
                                className='select2-search'
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
            <div>
                {this.renderModelSelector(modelId, disabled)}
            </div>
        );
    }

    renderTumorModelSelector(modelId, disabled) {
        return (
            <div>
                {this.renderModelSelector(modelId, disabled)}
            </div>
        );
    }

    renderModelSelector(modelId, disabled) {
        const {p} = this.props;
        return (
            <div>
                <h5><span>{p.t('analysis.rightPane.content.model')}</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group '>
                        <div className='btn-group btn-group-icon'>
                            <button
                                type='button'
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
                                onClick={() => this.onModelClick()}
                            >
                                <span className='text-muted'>{p.t('analysis.rightPane.content.models')}</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
                            <Select
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
        const {p} = this.props;
        return (
            <div>
                <h5><span>{p.t('analysis.rightPane.content.view')}</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group '>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                type='button'
                                disabled={disabled}
                                onClick={() => this.onViewsClick()}
                            >
                                <span className='text-muted'>{p.t('analysis.rightPane.content.views')}</span>
                                <span className='visible-xxs'><i className='md-i'>tune</i></span>
                            </button>
                        </div>
                        <div className='btn-group btn-group-select-group-max'>
                            <Select
                                tabIndex='-1'
                                className='select2'
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

    renderSamplesSelects(historyItem) {

        const selectedSamplesHash = _.keyBy(historyItem.samples, (sample) => sample.id);

        const rendersForType = {
            [analysisType.SINGLE]: (historyItem, disabled) => (
                <div className='tab-pane active'>
                     {this.renderSampleSelectSingle(historyItem.samples[0], disabled, selectedSamplesHash)}
                </div>
            ),
            [analysisType.TUMOR]: (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel'>
                     {this.renderSamplesSelectsTumorNormalHeader()}
                     {this.renderSamplesSelectsTumorNormalSampleTumor(historyItem.samples[0], disabled, selectedSamplesHash)}
                     {this.renderSamplesSelectsTumorNormalSampleNormal(historyItem.samples[1], disabled, selectedSamplesHash)}
                     <hr className='invisible' />
                </div>
            ),
            [analysisType.FAMILY]: (historyItem, disabled) => (
                <div className='tab-pane active' role='tabpanel'>
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
                {typeRender && typeRender(historyItem, false)}
            </div>
        );
    }

    renderSampleSelectSingle(sample, disabled, selectedSamplesHash) {
        const {p} = this.props;
        const value = sample ? sample.id : null;

        return (
            <div>
                <h5><span>{p.t('analysis.rightPane.content.sample')}</span></h5>
                <div className='form-group'>
                    <div className='col-xs-12 col-md-10 btn-group-select-group'>
                        <div className='btn-group btn-group-icon'>
                            <button
                                className='btn btn-default btn-fix-width'
                                disabled={disabled}
                                onClick={() => this.onSamplesClick(0)}
                            >
                                <span className='text-muted'>{p.t('analysis.rightPane.content.samples')}</span>
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
                                <span>{p.t('analysis.rightPane.sampleTypeAbbr.single')}</span>
                            </label>
                        </div>
                        
                    </div>
                </div>
            </div>
        );
    }

    renderSamplesSelectsTumorNormalHeader() {
        const {p} = this.props;
        return (
            <h5><span>{p.t('analysis.rightPane.content.samples')}</span></h5>
        );
    }

    renderSamplesSelectsTumorNormalSampleTumor(sample, disabled, selectedSamplesHash) {
        const {p} = this.props;
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
                                <span className='text-muted'>{p.t('analysis.rightPane.content.samples')}</span>
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
                            <span>{p.t('analysis.rightPane.sampleTypeAbbr.tumor')}</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderSamplesSelectsTumorNormalSampleNormal(sample, disabled, selectedSamplesHash) {
        const {p} = this.props;
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
                                <span className='text-muted'>{p.t('analysis.rightPane.content.samples')}</span>
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
                            <span>{p.t('analysis.rightPane.sampleTypeAbbr.normal')}</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderSamplesSelectsFamilyHeader() {
        const {p} = this.props;
        return (
            <h5><span>{p.t('analysis.rightPane.content.samples')}</span></h5>
        );
    }

    renderSamplesSelectsFamilyProband(sample, disabled, i, selectedSamplesHash) {
        const {p} = this.props;
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
                                <span className='text-muted'>{p.t('analysis.rightPane.content.samples')}</span>
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
                            <span>{p.t('analysis.rightPane.sampleTypeAbbr.proband')}</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderSamplesSelectsFamilyMember(sample, disabled, i, selectedSamplesHash) {
        const {p} = this.props;
        const value = sample ? sample.id : null;
        const typeLabels = FieldUtils.makeFieldTypeLabels(p);

        return (
            <div className='form-group' key={i}>
                <div className='col-xs-12 col-md-10 btn-group-select-group '>
                    <div className='btn-group btn-group-icon'>
                        <button
                            className='btn btn-default btn-fix-width'
                            disabled={disabled}
                            onClick={() => this.onSamplesClick(i)}
                        >
                                <span className='text-muted'>{p.t('analysis.rightPane.content.samples')}</span>
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
                            <span>{sample ? typeLabels[sample.type] : ''}</span>
                        </label>
                    </div>
                    
                </div>
            </div>
        );
    }

    renderAnalyzeButton() {
        const {historyItem, modelsList, fields, samplesList, ui: {languageId}, p} = this.props;
        const validationRules = [
            new CompoundHeterozygousModelRule({
                historyItem,
                modelsList,
                fields,
                samplesList,
                languageId,
                p
            })
        ];
        const validationResults = _.map(validationRules, rule => rule.validate());
        const error = _.find(validationResults, {isValid: false});
        const buttonParams = {
            title: error ? error.errorMessage : p.t('analysis.rightPane.content.analyzeTitle'),
            disabled: !!error
        };
        return (
            <div className='btn-toolbar btn-toolbar-form-actions'>
                <button
                    className='btn btn-primary'
                    disabled={buttonParams.disabled}
                    title={buttonParams.title}
                    onClick={() => this.onAnalyzeButtonClick(true)}
                >
                    <span>{p.t('analysis.rightPane.content.analyze')}</span>
                </button>
                <a
                    type='button'
                    className='btn btn-link btn-uppercase'
                    onClick={() => this.onCancelButtonClick()}
                ><span>{p.t('analysis.rightPane.content.restoreToDefault')}</span></a>
            </div>
        );
    }

    renderDeleteAnalysisButton() {
        const {p} = this.props;
        return (
            <button
                className='btn btn-sm btn-link-light-default pull-right btn-right-in-form'
                onClick={() => this.onDeleteAnalysisClick()}
            >
                <span>{p.t('analysis.rightPane.deleteAnalysis')}</span>
            </button>
        );
    }

    renderAnalysisName(name, disabled) {
        const {p} = this.props;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={name}
                        disabled={disabled}
                        placeholder={p.t('analysis.rightPane.analysisNamePlaceHolder')}
                        className='form-control material-input-sm material-input-heading text-primary'
                        maxLength={config.ANALYSIS.MAX_NAME_LENGTH}
                        onChange={(str) => this.onAnalysisNameChange(str)}
                    />
                </div>
            </div>
        );
    }

    renderAnalysisDescription(description, disabled) {
        const {p} = this.props;
        return (
            <div className='form-group'>
                <div className='col-md-12 col-xs-12'>
                    <Input
                        value={description}
                        disabled={disabled}
                        placeholder={p.t('analysis.rightPane.analysisDescriptionPlaceHolder')}
                        className='form-control material-input-sm'
                        maxLength={config.ANALYSIS.MAX_DESCRIPTION_LENGTH}
                        onChange={(str) => this.onAnalysisDescriptionChange(str)}
                    />
                </div>
            </div>
        );
    }

    renderAnalysisDates(createdDate) {
        const {p} = this.props;
        return (
            <div className='label-group-date'>
                <label>
                    <span>{p.t('analysis.rightPane.created')}</span>: <span>{formatDate(createdDate)}</span>
                </label>
            </div>
        );
    }

    analysisTypeCaption(type) {
        const {p} = this.props;
        return {
            [analysisType.SINGLE]: p.t('analysis.rightPane.analysisType.single'),
            [analysisType.TUMOR]: p.t('analysis.rightPane.analysisType.tumor'),
            [analysisType.FAMILY]: p.t('analysis.rightPane.analysisType.family')
        }[type] || '';
    }

    sampleTypeCaption(type) {
        const {p} = this.props;
        return {
            [sampleType.SINGLE]: p.t('analysis.rightPane.sampleType.single'),
            [sampleType.TUMOR]: p.t('analysis.rightPane.sampleType.tumor'),
            [sampleType.NORMAL]: p.t('analysis.rightPane.sampleType.normal'),
            [sampleType.PROBAND]: p.t('analysis.rightPane.sampleType.proband'),
            [sampleType.MOTHER]: p.t('analysis.rightPane.sampleType.mother'),
            [sampleType.FATHER]: p.t('analysis.rightPane.sampleType.father')
        }[type] || '';
    }

    renderAnalysisHeaderTabs(historyItemType) {
        const {dispatch} = this.props;
        const tabs = [
            {type: analysisType.SINGLE, className: 'single-tab'},
            {type: analysisType.TUMOR, className: 'tumor-normal-tab'},
            {type: analysisType.FAMILY, className: 'family-tab'}
        ];
        return (
            <ul role='tablist' className='nav nav-tabs'>
                {tabs.map((tab) => {
                    return this.renderAnalysisHeaderTab(
                        historyItemType === tab.type,
                        tab.className,
                        this.analysisTypeCaption(tab.type),
                        () => dispatch(this.actionEdit({type: tab.type}))
                    );
                })}
            </ul>
        );
    }
    
    renderAnalysisHeaderTab(isActive, tabClassName, tabCaption, onClick) {
        return (
            <li
                key={tabClassName}
                className={classNames(tabClassName, {'active': isActive})}
            >
                <a
                    onClick={onClick}
                >
                    <span>
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
            viewsList: {hashedArray: {hash: viewsHash}},
            ui: {languageId},
            p
        } = this.props;

        const selectedFilter = filtersHash[historyItem.filterId];
        const selectedModel = historyItem.modelId && modelsHash[historyItem.modelId];
        const selectedView = viewsHash[historyItem.viewId];
        return (
            <div className='dl-group-view-mode'>
                <dl>
                    <dt>{p.t('analysis.rightPane.content.analysisType')}</dt>
                    <dd>{this.analysisTypeCaption(historyItem.type)}</dd>
                </dl>
                {historyItem.samples.map((sampleInfo) => {
                    const sampleId = sampleInfo.id;
                    const sample = samplesHash[sampleId];

                    return (
                        <dl key={sampleId}>
                            <dt><span>{p.t('analysis.rightPane.content.sample')}</span>
                                ({this.sampleTypeCaption(sampleInfo.type)})
                            </dt>
                            <dd>{sample && getItemLabelByNameAndType(i18n.getEntityText(sample, languageId).name, sample.type, p)}</dd>
                        </dl>
                    );
                })}
                <dl>
                    <dt>{p.t('analysis.rightPane.content.filter')}</dt>
                    <dd>{selectedFilter && getItemLabelByNameAndType(i18n.getEntityText(selectedFilter, languageId).name, selectedFilter.type, p)}</dd>
                </dl>
                {historyItem.modelId &&
                    <dl>
                        <dt>{p.t('analysis.rightPane.content.model')}</dt>
                        <dd>{selectedModel && getItemLabelByNameAndType(i18n.getEntityText(selectedModel, languageId).name, selectedModel.type, p)}</dd>
                    </dl>
                }
                <dl>
                    <dt>{p.t('analysis.rightPane.content.view')}</dt>
                    <dd>{selectedView && getItemLabelByNameAndType(i18n.getEntityText(selectedView, languageId).name, selectedView.type, p)}</dd>
                </dl>

                <hr />
                <div className='btn-toolbar btn-toolbar-form-actions'>
                    <a
                       type='button'
                       className='btn btn-link btn-uppercase'
                       onClick={() => this.onDuplicateButtonClick()}
                    ><span>{p.t('analysis.rightPane.content.duplicate')}</span></a>

                    <a
                        className='btn btn-link btn-uppercase'
                        role='button'
                        onClick={() => this.onAnalyzeButtonClick(false)}
                    >
                        <span>{p.t('analysis.rightPane.content.viewResults')}</span>
                    </a>
                </div>
            </div>
        );
    }

    isViewDisabled(view) {
        const {auth: {isDemo}} = this.props;
        return entityTypeIsDemoDisabled(view.type, isDemo);
    }

    getViewOptions() {
        const {viewsList: {hashedArray: {array: views}}, ui: {languageId}, p} = this.props;
        return views.map(
            (viewItem) => {
                const isDisabled = this.isViewDisabled(viewItem);
                const label = getItemLabelByNameAndType(i18n.getEntityText(viewItem, languageId).name, viewItem.type, p);
                return {
                    value: viewItem.id, label, disabled: isDisabled
                };
            }
        );
    }

    isFilterDisabled(filter) {
        const {auth: {isDemo}} = this.props;
        return entityTypeIsDemoDisabled(filter.type, isDemo);
    }

    getFilterOptions() {
        const {filtersList: {hashedArray: {array: filters}}, ui: {languageId}, p} = this.props;
        return filters.map((filterItem) => {
            const isDisabled = this.isFilterDisabled(filterItem);
            const label = getItemLabelByNameAndType(i18n.getEntityText(filterItem, languageId).name, filterItem.type, p);
            return {
                value: filterItem.id, label, disabled: isDisabled
            };
        });
    }

    isModelDisabled(model) {
        const {auth: {isDemo}} = this.props;
        return entityTypeIsDemoDisabled(model.type, isDemo);
    }

    getModelOptions() {
        const {modelsList, historyItem, ui: {languageId}, p} = this.props;
        const models = modelsList.hashedArray.array;
        return models
            .filter((model) => model.analysisType === historyItem.type)
            .map((model) => {
                const isDisabled = this.isModelDisabled(model);
                const label = getItemLabelByNameAndType(i18n.getEntityText(model, languageId).name, model.type, p);
                return {value: model.id, label, disabled: isDisabled};
            });
    }

    isSampleDisabled(sample) {
        const {auth: {isDemo}} = this.props;
        return entityTypeIsDemoDisabled(sample.type, isDemo);
    }

    getSampleOptions(value, selectedSamplesHash) {
        const {ui: {languageId}, samplesList: {hashedArray: {array: samples}}, p} = this.props;
        return _.chain(samples)
            .filter((sample) => sample.uploadState === SAMPLE_UPLOAD_STATE.COMPLETED)
            .map((sampleItem) => {
                const isDisabled = sampleItem.id !== value && (this.isSampleDisabled(sampleItem) || !!selectedSamplesHash[sampleItem.id] || _.isEmpty(sampleItem.sampleFields));
                const {type: sampleType, id: sampleId} = sampleItem;
                const sampleName = i18n.getEntityText(sampleItem, languageId).name;
                const label = getItemLabelByNameAndType(sampleName, sampleType, p);
                return {value: sampleId, label, disabled: isDisabled};
            })
            .value();
    }

    onDeleteAnalysisClick() {
        const {dispatch, historyItem: {id: historyItemId}} = this.props;
        if (historyItemId) {
            dispatch(deleteServerAnalysesHistoryItemAsync(historyItemId));
        }
    }

    /**
     * @param {Object} propertyObject
     */
    editAnalysisProperty(propertyObject) {
        const {dispatch, historyItem, ui: {languageId}} = this.props;
        if (historyItem.id) {
            dispatch(editExistentAnalysesHistoryItem(i18n.changeEntityText(historyItem, languageId, propertyObject)));
            dispatch(updateAnalysesHistoryItemAsync(historyItem.id))
                .then(updatedAnalysis => dispatch(editExistentAnalysesHistoryItem(updatedAnalysis)));
        } else {
            dispatch(this.actionEdit(propertyObject));
        }
    }

    onAnalysisNameChange(name) {
        if (!name) {
            return;
        }
        this.editAnalysisProperty({name});
    }

    onAnalysisDescriptionChange(description) {
        this.editAnalysisProperty({description});
    }

    onDuplicateButtonClick() {
        const {dispatch, historyItem, ui: {languageId}, p} = this.props;
        const historyItemName = i18n.getEntityText(historyItem, languageId).name;
        const newHistoryItemName = p.t('analysis.copyOf', {name: historyItemName});
        dispatch(duplicateAnalysesHistoryItem(historyItem, {name: newHistoryItemName}, languageId));
    }

    onCancelButtonClick() {
        const {
            dispatch,
            samplesList: {hashedArray: {array: samples}},
            viewsList: {hashedArray: {array: views}},
            filtersList: {hashedArray: {array: filters}},
            ui: {languageId},
            p
        } = this.props;
        const sample = getDefaultOrStandardItem(samples);
        const filter = getDefaultOrStandardItem(filters);
        const view = getDefaultOrStandardItem(views);
        const newAnalysisName = HistoryItemUtils.makeNewHistoryItemName(sample, filter, view, languageId);
        const newAnalysisDescription = p.t('analysis.descriptionOf', {name: newAnalysisName});
        dispatch(createNewHistoryItem(
            sample, filter, view,
            {name: newAnalysisName, description: newAnalysisDescription},
            languageId
        ));
    }

    onAnalyzeButtonClick(isEditing) {
        const {dispatch, historyItem, currentItemId, ui: {languageId}} = this.props;
        const searchParams = i18n.changeEntityText(
            {
                id: isEditing ? null : currentItemId,
                type: historyItem.type,
                samples: historyItem.samples,
                viewId: historyItem.viewId,
                filterId: historyItem.filterId,
                modelId: historyItem.modelId
            },
            languageId,
            {
                name: i18n.getEntityText(historyItem, languageId).name,
                description: i18n.getEntityText(historyItem, languageId).description
            }
        );
        dispatch(analyze(searchParams)).then((analysis) => {
            if (isEditing && analysis) {
                dispatch(setEditedHistoryItem(analysis));
            } else if (analysis) {
                dispatch(editExistentAnalysesHistoryItem(analysis));
            }
        });
        dispatch(closeModal(modalName.ANALYSIS));
    }

    onViewsClick() {
        const {dispatch, historyItem, viewsList, samplesList: {hashedArray: {hash: samplesHash}}, fields, ui: {languageId}} = this.props;
        const samples = _.map(historyItem.samples, (sampleInfo) => samplesHash[sampleInfo.id]);
        const allowedFields = FieldUtils.makeViewFilterAllowedFields(samples, fields.totalFieldsHashedArray.hash, fields.sourceFieldsList, languageId);
        dispatch(viewBuilderStartEdit(null, viewsList.hashedArray.hash[historyItem.viewId], allowedFields, languageId));
        const action = this.actionEdit({viewId: null});
        dispatch(viewBuilderOnSave(action, 'changeItem.viewId'));
        dispatch(openModal(modalName.VIEWS));
    }

    onViewSelect(viewId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({viewId: viewId}));
    }
    
    onFiltersClick() {
        const {dispatch, historyItem, filtersList, samplesList: {hashedArray: {hash: samplesHash}}, fields, ui: {languageId}} = this.props;
        const mainSample = samplesHash[historyItem.samples[0].id];
        const allowedFields = FieldUtils.makeViewFilterAllowedFields([mainSample], fields.totalFieldsHashedArray.hash, fields.sourceFieldsList, languageId);
        const filterFiltersStrategy = {name: filterBuilderStrategyName.FILTER};
        dispatch(filterBuilderStartEdit(null, filtersList.hashedArray.hash[historyItem.filterId], fields, allowedFields, filterFiltersStrategy, filtersList, languageId));
        const action = this.actionEdit({filterId: null});
        dispatch(filterBuilderOnSave(action, 'changeItem.filterId'));
        dispatch(openModal(modalName.FILTERS));
    }

    onFilterSelect(filterId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({filterId: filterId}));
    }

    onModelClick() {
        const {dispatch, historyItem, modelsList, samplesList: {hashedArray: {hash: samplesHash}}, fields, ui: {languageId}} = this.props;
        const samples = _.map(historyItem.samples, (sampleInfo) => samplesHash[sampleInfo.id]);
        const samplesTypes = _.reduce(
            sampleTypesForAnalysisType[historyItem.type],
            (hash, sampleType, index) => ({
                ...hash,
                [historyItem.samples[index].id]: sampleType
            }),
            {}
        );
        const allowedFields = FieldUtils.makeModelAllowedFields(samples, samplesTypes, fields.totalFieldsHashedArray.hash, languageId);
        const modelFiltersStrategy = {name: filterBuilderStrategyName.MODEL, analysisType: historyItem.type};
        const analysisTypeModelsList = {
            ...modelsList,
            hashedArray: ImmutableHashedArray.makeFromArray(modelsList.hashedArray.array.filter((model) => model.analysisType === historyItem.type))
        };
        dispatch(filterBuilderStartEdit(null, modelsList.hashedArray.hash[historyItem.modelId], fields, allowedFields, modelFiltersStrategy, analysisTypeModelsList, languageId));
        const action = this.actionEdit({modelId: null});
        dispatch(filterBuilderOnSave(action, 'changeItem.modelId'));
        dispatch(openModal(modalName.FILTERS));
    }

    onModelSelect(modelId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({modelId: modelId}));
    }
    
    onSamplesClick(sampleIndex) {
        const {dispatch, historyItem} = this.props;
        const selectedSamplesIds = _.map(historyItem.samples, (sample) => sample.id);
        const action = this.actionEdit({sample: {index: sampleIndex, id: selectedSamplesIds[sampleIndex]}});
        dispatch(samplesOnSave(selectedSamplesIds, action, 'changeItem.sample.index', 'changeItem.sample.id', action));
        dispatch(openModal(modalName.UPLOAD));
    }
    
    onSampleSelect(sampleIndex, sampleId) {
        const {dispatch} = this.props;
        dispatch(this.actionEdit({sample: {index: sampleIndex, id: sampleId}}));
    }

    actionEdit(change) {
        const {samplesList, modelsList, auth: {isDemo}, ui: {languageId}} = this.props;
        return editAnalysesHistoryItem(
            samplesList,
            modelsList,
            isDemo,
            change,
            languageId
        );
    }
}

const hashedArrayPropTypeShape = PropTypes.shape({
    hashedArray: {
        hash: PropTypes.object.isRequired,
        array: PropTypes.array.isRequired
    }
}).isRequired;

AnalysisRightPane.propTypes = {
    dispatch: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    isBringToFront: PropTypes.bool.isRequired,
    auth: PropTypes.shape({isDemo: PropTypes.bool.isRequired}).isRequired,
    ui: PropTypes.shape({languageId: PropTypes.string.isRequired}).isRequired,
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired,
    fields: PropTypes.object.isRequired,
    samplesList: hashedArrayPropTypeShape,
    filtersList: hashedArrayPropTypeShape,
    modelsList: hashedArrayPropTypeShape,
    viewsList: hashedArrayPropTypeShape,
    historyItem: PropTypes.shape({id: PropTypes.string.isRequired}),
    currentItemId: PropTypes.string.isRequired
};
