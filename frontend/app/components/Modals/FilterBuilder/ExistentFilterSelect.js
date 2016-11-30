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


export default class ExistentFilterSelect extends Component {

    render() {
        const {auth, texts, filterBuilder} = this.props;
        const selectedFilter = filterBuilder.editingFilter.filter;
        const filters = filterBuilder.filtersList.hashedArray.array;
        const isDemoSession = auth.isDemo;
        const isFilterEditable = entityTypeIsEditable(selectedFilter.type);
        const isFilterDuplicable = selectedFilter.modelType !== 'complex';
        return (
            <div className='form-rows-dynamic'>
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
        return (
            <h5 data-localize='filters.setup.selector.label'>Available {texts.Filters}</h5>
        );
    }

    renderWarning(isDemoSession, selectedFilterType, texts) {
        const warningText = getReadonlyReasonForSessionAndType(texts.filter, isDemoSession, selectedFilterType);

        if (!warningText) {
            return null;
        }
        return (
            <div className='alert alert-help'>
                <span data-localize='filters.setup.selector.description'>
                    {warningText}
                </span>
            </div>
        );
    }

    renderFiltersSelector(filters) {
        const selectItems = filters.map( filter => ({
            value: filter.id,
            label: getItemLabelByNameAndType(filter.name, filter.type)
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
            <div className='btn-group' data-localize='actions.duplicate.help' data-toggle='tooltip'
                 data-placement='bottom' data-container='body'>
                {isFilterDuplicable && this.renderDuplicateFilterButton(isDemoSession, texts)}
                {isFilterEditable && this.renderResetFilterButton(texts)}
                {isFilterEditable && this.renderDeleteFilterButton(texts)}
            </div>
        );
    }

    renderDuplicateFilterButton(isDemoSession, texts) {
        const title = isDemoSession ? `Login or register to work with ${texts.filter}` : 'Make a copy for editing';
        return (
            <button type='button'
                    className='btn btn-default in'
                    id='dblBtn'
                    onClick={() => this.onDuplicateClick()}
                    disabled={isDemoSession}
                    title={title}
            >
                <span data-localize='actions.duplicate.title' className='hidden-xs'>Duplicate</span>
                <span className='visible-xs'><i className='md-i'>content_copy</i></span>
            </button>
        );
    }

    renderResetFilterButton(texts) {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onResetFilterClick()}
            >
                <span data-localize='filters.setup.reset.title' className='hidden-xs'>Reset {texts.Filter}</span>
                <span className='visible-xs'><i className='md-i'>settings_backup_restore</i></span>
            </button>
        );
    }

    renderDeleteFilterButton(texts) {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onDeleteFilterClick()}
            >
                <span data-localize='filters.setup.delete.title' className='hidden-xs'>Delete {texts.Filter}</span>
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
        this.props.dispatch(filterBuilderRestartEdit(false, this.getFilterForId(filters, filterId)));
    }

    onDuplicateClick() {
        const filter = this.getSelectedFilter();
        this.props.dispatch(filterBuilderRestartEdit(true, filter));
    }

    onResetFilterClick() {
        const filter = this.getSelectedFilter();
        this.props.dispatch(filterBuilderRestartEdit(false, filter));
    }

    onDeleteFilterClick() {
        const {dispatch} = this.props;
        const filterId = this.getSelectedFilter().id;
        dispatch(filterBuilderDeleteFilter(filterId)).then((newFilter) => {
            dispatch(fireOnSaveAction(newFilter));
        });
    }

}
