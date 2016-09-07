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
        const {auth} = this.props;
        const selectedFilter = this.props.filterBuilder.editingFilter.filter;
        const filters = this.props.filterBuilder.filtersList.hashedArray.array;
        const isDemoSession = auth.isDemo;
        const isFilterEditable = entityTypeIsEditable(selectedFilter.type);

        return (
            <div className='in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle()}
                </div>
                {this.renderWarning(isDemoSession, selectedFilter.type)}
                <div className='row grid-toolbar row-head-selector'>
                    {this.renderFiltersSelector(filters)}
                    {this.renderButtonGroup(isDemoSession, isFilterEditable)}
                </div>
            </div>
        );
    }

    renderTitle() {
        return (
            <div className='col-sm-6'>
                <label data-localize='filters.setup.selector.label'>Available Filters</label>
            </div>
        );
    }

    renderWarning(isDemoSession, selectedFilterType) {
        const warningText = getReadonlyReasonForSessionAndType('filter', isDemoSession, selectedFilterType);

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

    renderButtonGroup(isDemoSession, isFilterEditable) {
        return (
            <div className='col-sm-6'>
                <div className='btn-group' data-localize='actions.duplicate.help' data-toggle='tooltip'
                     data-placement='bottom' data-container='body'>
                    {this.renderDuplicateFilterButton(isDemoSession)}
                    {isFilterEditable && this.renderResetFilterButton()}
                    {isFilterEditable && this.renderDeleteFilterButton()}
                </div>
            </div>
        );
    }

    renderDuplicateFilterButton(isDemoSession) {
        const title = isDemoSession ? 'Login or register to work with filter' : 'Make a copy for editing';
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

    renderResetFilterButton() {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onResetFilterClick()}
            >
                <span data-localize='filters.setup.reset.title' className='hidden-xs'>Reset Filter</span>
                <span className='visible-xs'><i className='md-i'>settings_backup_restore</i></span>
            </button>
        );
    }

    renderDeleteFilterButton() {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onDeleteFilterClick()}
            >
                <span data-localize='filters.setup.delete.title' className='hidden-xs'>Delete Filter</span>
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
        const filterId = this.getSelectedFilter().id;
        this.props.dispatch(filterBuilderDeleteFilter(filterId)).then((newFilter) => {
            this.props.dispatch(fireOnSaveAction(newFilter));
        });
    }

}
