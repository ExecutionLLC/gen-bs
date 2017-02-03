import React, {Component} from 'react';
import 'react-select/dist/react-select.css';
import _ from 'lodash';

import Select from '../../shared/Select';
import {
    getItemLabelByNameAndType,
    getReadonlyReasonForSessionAndType
} from '../../../utils/stringUtils';
import {
    filterBuilderRestartEdit,
    filterBuilderDeleteFilter,
    fireOnSaveAction
} from '../../../actions/filterBuilder';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import {isFilterComplexModel} from '../../../utils/filterUtils';
import * as i18n from '../../../utils/i18n';


export default class ExistentFilterSelect extends Component {

    render() {
        const {auth, texts, filterBuilder} = this.props;
        const selectedFilter = filterBuilder.editingFilter.filter;
        const filters = filterBuilder.filtersList.hashedArray.array;
        const isDemoSession = auth.isDemo;
        const isFilterEditable = entityTypeIsEditable(selectedFilter.type);
        const isFilterDuplicable = !isFilterComplexModel(selectedFilter);
        return (
            <div className='form-rows'>
                <div className='form-group'>
                    {this.renderTitle(texts)}
                </div>
                {this.renderWarning(isDemoSession, selectedFilter.type, texts)}
                <div className='form-group row-head-selector'>
                    <div className='col-sm-12 col-md-11 col-lg-9 btn-group-select-group'>
                        {this.renderFiltersSelector(filters)}
                        {this.renderButtonGroup(isDemoSession, isFilterEditable, isFilterDuplicable, texts)}
                    </div>
                </div>                
            </div>
        );
    }

    renderTitle(texts) {
        const {p} = this.props;
        return (
            <h5>
                {p.t('filterAndModel.existentFilterSelect.title', {filtersOrModels: texts.Filters})}
            </h5>
        );
    }

    renderWarning(isDemoSession, selectedFilterType, texts) {
        const {p} = this.props;
        const warningText = getReadonlyReasonForSessionAndType(texts.filter, isDemoSession, selectedFilterType, p);

        if (!warningText) {
            return null;
        }
        return (
            <div className='alert alert-help'>
                <span>
                    {warningText}
                </span>
            </div>
        );
    }

    renderFiltersSelector(filters) {
        const {ui: {languageId}} = this.props;
        const selectItems = filters.map( filter => ({
            value: filter.id,
            label: getItemLabelByNameAndType(i18n.getEntityText(filter, languageId).name, filter.type)
        }));

        return (
            <div className='btn-group btn-group-select-group-max'>
                <Select
                    options={selectItems}
                    value={this.getSelectedFilter().id}
                    onChange={(val) => this.onSelectChange(filters, val.value)}
                />
            </div>
        );
    }

    renderButtonGroup(isDemoSession, isFilterEditable, isFilterDuplicable, texts) {
        return (
            <div className='btn-group' data-toggle='tooltip'
                 data-placement='bottom' data-container='body'>
                {isFilterDuplicable && this.renderDuplicateFilterButton(isDemoSession, texts)}
                {isFilterEditable && this.renderResetFilterButton(texts)}
                {isFilterEditable && this.renderDeleteFilterButton(texts)}
            </div>
        );
    }

    renderDuplicateFilterButton(isDemoSession, texts) {
        const {p} = this.props;
        const title = isDemoSession ? `Login or register to work with ${texts.filter}` : 'Make a copy for editing';
        return (
            <button type='button'
                    className='btn btn-default in'
                    id='dblBtn'
                    onClick={() => this.onDuplicateClick()}
                    disabled={isDemoSession}
                    title={title}
            >
                <span className='hidden-xs'>{p.t('filterAndModel.existentFilterSelect.duplicate')}</span>
                <span className='visible-xs'><i className='md-i'>content_copy</i></span>
            </button>
        );
    }

    renderResetFilterButton(texts) {
        const {p} = this.props;
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onResetFilterClick()}
            >
                <span className='hidden-xs'>{p.t('filterAndModel.existentFilterSelect.reset', {filterOrModel: texts.Filter})}</span>
                <span className='visible-xs'><i className='md-i'>settings_backup_restore</i></span>
            </button>
        );
    }

    renderDeleteFilterButton(texts) {
        const {p} = this.props;
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onDeleteFilterClick()}
            >
                <span className='hidden-xs'>{p.t('filterAndModel.existentFilterSelect.deleteItem', {filterOrModel: texts.Filter})}</span>
                <span className='visible-xs'><i className='md-i'>close</i></span>
            </button>
        );
    }

    getSelectedFilter() {
        return this.props.filterBuilder.editingFilter.filter;
    }

    getFilterForId(filters, filterId) {
        return _.find(filters, {id: filterId}) || null;
    }

    onSelectChange(filters, filterId) {
        this.props.dispatch(filterBuilderRestartEdit(null, this.getFilterForId(filters, filterId, this.props.ui.languageId)));
    }

    onDuplicateClick() {
        const {p, ui: {languageId}} = this.props;
        const filter = this.getSelectedFilter();
        const selectedFilterName = i18n.getEntityText(filter, languageId).name;
        const newFilterName = p.t('filterAndModel.copyOf', {name: selectedFilterName});
        this.props.dispatch(filterBuilderRestartEdit({name: newFilterName}, filter, this.props.ui.languageId));
    }

    onResetFilterClick() {
        const filter = this.getSelectedFilter();
        this.props.dispatch(filterBuilderRestartEdit(null, filter, this.props.ui.languageId));
    }

    onDeleteFilterClick() {
        const {dispatch, ui: {languageId}} = this.props;
        const filterId = this.getSelectedFilter().id;
        dispatch(filterBuilderDeleteFilter(filterId, languageId)).then((newFilter) => {
            dispatch(fireOnSaveAction(newFilter));
        });
    }

}
