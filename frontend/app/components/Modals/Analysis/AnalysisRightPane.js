import _ from 'lodash';
import classNames from 'classnames';
import React, {PropTypes} from 'react';
import Select from '../../shared/Select';
import Input from '../../shared/Input';
import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {formatDate} from './../../../utils/dateUtil';
import {
    duplicateAnalysesHistoryItem,
    createNewDefaultHistoryItem,
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
import {ImmutableHashedArray} from '../../../utils/immutable';
import CompoundHeterozygousModelRule from './rules/CompHeterModelRule';
import config from '../../../../config';
import {SAMPLE_UPLOAD_STATE} from '../../../actions/fileUpload';
import * as i18n from '../../../utils/i18n';


// TODO class contains many similar and unused functions, refactor there with updated layout

function FormGroupSelectorWrapper(props) {
    return (
        <div className='form-group'>
            <div className='col-xs-12 col-md-10 btn-group-select-group'>
                {props.children}
            </div>
        </div>
    );
}

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
        const showModelSelect = historyItem.type === analysisType.FAMILY || historyItem.type === analysisType.TUMOR;

        return (
            <div>
                {this.renderSamplesSelects(historyItem)}
                {this.renderFilterSelector(historyItem.filterId)}
                {showModelSelect && this.renderModelSelector(historyItem.modelId)}
                {this.renderViewSelector(historyItem.viewId)}
                <hr className='invisible' />
                {this.renderAnalyzeButton()}
            </div>
        );
    }

    renderFormGroupSelectorButton(title, onClick) {
        return (
            <div className='btn-group btn-group-icon'>
                <button
                    className='btn btn-default btn-fix-width'
                    type='button'
                    onClick={onClick}
                >
                            <span className='text-muted'>
                                {title}
                            </span>
                    <span className='visible-xxs'><i className='md-i'>tune</i></span>
                </button>
            </div>
        );
    }

    renderFormGroupSelectorSelect(options, value, onSelect) {
        return (
            <div className='btn-group btn-group-select-group-max'>
                <Select
                    tabIndex='-1'
                    className='select2-search'
                    options={options}
                    value={value}
                    onChange={(item) => onSelect(item.value)}
                />
            </div>
        );
    }

    renderFormGroupSelector(title, options, value, onClick, onSelect) {
        return (
            <FormGroupSelectorWrapper>
                {this.renderFormGroupSelectorButton(title, onClick)}
                {this.renderFormGroupSelectorSelect(options, value, onSelect)}
            </FormGroupSelectorWrapper>
       );
    }

    renderFilterSelector(filterId) {
        const {p} = this.props;
        return (
            <div>
                {this.renderFormGroupHeader('analysis.rightPane.content.filter')}
                {this.renderFormGroupSelector(
                    p.t('analysis.rightPane.content.filters'),
                    this.getFilterOptions(),
                    filterId,
                    () => this.onFiltersClick(),
                    (value) => this.onFilterSelect(value)
                )}
            </div>
        );
    }
    
    renderModelSelector(modelId) {
        const {p} = this.props;
        return (
            <div>
                {this.renderFormGroupHeader('analysis.rightPane.content.model')}
                {this.renderFormGroupSelector(
                    p.t('analysis.rightPane.content.models'),
                    this.getModelOptions(),
                    modelId,
                    () => this.onModelsClick(),
                    (value) => this.onModelSelect(value)
                )}
            </div>
        );
    }

    renderViewSelector(viewId) {
        const {p} = this.props;
        return (
            <div>
                {this.renderFormGroupHeader('analysis.rightPane.content.view')}
                {this.renderFormGroupSelector(
                    p.t('analysis.rightPane.content.views'),
                    this.getViewOptions(),
                    viewId,
                    () => this.onViewsClick(),
                    (value) => this.onViewSelect(value)
                )}
            </div>
        );
    }

    renderSamplesSelects(historyItem) {
        const selectedSamplesHash = _.keyBy(historyItem.samples, (sample) => sample.id);
        const isManySamples = historyItem.samples.length > 1;

        return (
            <div className='tab-content'>
                <div className='tab-pane active'>
                    {this.renderSamplesHeader(isManySamples)}
                    {historyItem.samples.map( (sample, i) => {
                        return this.renderSampleSelect(sample, selectedSamplesHash, i, sample.type);
                    })}
                    {isManySamples && <hr className='invisible' />}
                </div>
            </div>
        );
    }

    renderFormGroupHeader(template) {
        const {p} = this.props;
        return (
            <h5>
                <span>
                    {p.t(template)}
                </span>
            </h5>
        );
    }

    renderSamplesHeader(isManySamples) {
        return this.renderFormGroupHeader(
            isManySamples ?
                'analysis.rightPane.content.samples' :
                'analysis.rightPane.content.sample'
        );
    }

    renderSelectSampleTypeLabel(isPrimary, sampleType) {
        const {p} = this.props;
        const labelClassNames = classNames(
            'label',
            'label-round',
            isPrimary ? 'label-dark-default' : 'label-default'
        );
        const typeLabel = FieldUtils.makeFieldTypeLabel(p, sampleType);
        return (
            <div className='btn-group-prefix'>
                <label className={labelClassNames}>
                    <span>{typeLabel}</span>
                </label>
            </div>
        );
    }

    renderSampleSelect(sample, selectedSamplesHash, sampleIndex, sampleType) {
        const {p} = this.props;
        const value = sample ? sample.id : null;

        return (
            <FormGroupSelectorWrapper key={sampleIndex}>
                {this.renderFormGroupSelectorButton(
                    p.t('analysis.rightPane.content.samples'),
                    () => this.onSamplesClick(sampleIndex)
                )}
                {this.renderFormGroupSelectorSelect(
                    this.getSampleOptions(value, selectedSamplesHash),
                    value,
                    (value) => this.onSampleSelect(sampleIndex, value)
                )}
                {this.renderSelectSampleTypeLabel(!sampleIndex, sampleType)}
            </FormGroupSelectorWrapper>
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
                >
                    <span>
                        {p.t('analysis.rightPane.content.restoreToDefault')}
                    </span>
                </a>
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
                <span>
                    {p.t('analysis.rightPane.deleteAnalysis')}
                </span>
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
                    href='#'
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

    getEntityOptions(entityArray) {
        const {auth: {isDemo}, ui: {languageId}, p} = this.props;
        return entityArray.map(
            (item) => ({
                value: item.id,
                label: getItemLabelByNameAndType(i18n.getEntityText(item, languageId).name, item.type, p),
                disabled: entityTypeIsDemoDisabled(item.type, isDemo)
            })
        );
    }

    getViewOptions() {
        const {viewsList: {hashedArray: {array: views}}} = this.props;
        return this.getEntityOptions(views);
    }

    getFilterOptions() {
        const {filtersList: {hashedArray: {array: filters}}} = this.props;
        return this.getEntityOptions(filters);
    }

    getModelOptions() {
        const {modelsList: {hashedArray: {array: models}}, historyItem} = this.props;
        return this.getEntityOptions(models.filter((model) => model.analysisType === historyItem.type));
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
        const {dispatch} = this.props;
        dispatch(createNewDefaultHistoryItem());
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

    onModelsClick() {
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
    hashedArray: PropTypes.shape({
        hash: PropTypes.object.isRequired,
        array: PropTypes.array.isRequired
    }).isRequired
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
