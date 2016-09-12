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
        const {auth, verb, filterBuilder} = this.props;
        const selectedFilter = filterBuilder.editingFilter.filter;
        const filters = filterBuilder.filtersList.hashedArray.array;
        const isDemoSession = auth.isDemo;
        const isFilterEditable = entityTypeIsEditable(selectedFilter.type);
        const isFilterDuplicable = !!filterBuilder.editingFilter.parsedFilter;

        return (
            <div className='in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle(verb)}
                </div>
                {this.renderWarning(isDemoSession, selectedFilter.type, verb)}
                <div className='row grid-toolbar row-head-selector'>
                    {this.renderFiltersSelector(filters)}
                    {this.renderButtonGroup(isDemoSession, isFilterEditable, isFilterDuplicable, verb)}
                </div>
            </div>
        );
    }

    renderTitle(verb) {
        return (
            <div className='col-sm-6'>
                <label data-localize='filters.setup.selector.label'>Available {verb.Filters}</label>
            </div>
        );
    }

    renderWarning(isDemoSession, selectedFilterType, verb) {
        const warningText = getReadonlyReasonForSessionAndType(verb.filter, isDemoSession, selectedFilterType);

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
            <div className='col-sm-6'>
                <Select
                    options={selectItems}
                    value={this.getSelectedFilter().id}
                    onChange={(val) => this.onSelectChange(filters, val.value)}
                />
            </div>
        );
    }

    renderButtonGroup(isDemoSession, isFilterEditable, isFilterDuplicable, verb) {
        return (
            <div className='col-sm-6'>
                <div className='btn-group' data-localize='actions.duplicate.help' data-toggle='tooltip'
                     data-placement='bottom' data-container='body'>
                    {isFilterDuplicable && this.renderDuplicateFilterButton(isDemoSession, verb)}
                    {isFilterEditable && this.renderResetFilterButton(verb)}
                    {isFilterEditable && this.renderDeleteFilterButton(verb)}
                </div>
            </div>
        );
    }

    renderDuplicateFilterButton(isDemoSession, verb) {
        const title = isDemoSession ? `Login or register to work with ${verb.filter}` : 'Make a copy for editing';
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

    renderResetFilterButton(verb) {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onResetFilterClick()}
            >
                <span data-localize='filters.setup.reset.title' className='hidden-xs'>Reset {verb.Filter}</span>
                <span className='visible-xs'><i className='md-i'>settings_backup_restore</i></span>
            </button>
        );
    }

    renderDeleteFilterButton(verb) {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onDeleteFilterClick()}
            >
                <span data-localize='filters.setup.delete.title' className='hidden-xs'>Delete {verb.Filter}</span>
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
