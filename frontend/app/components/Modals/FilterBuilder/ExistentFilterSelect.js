import React, {Component} from 'react';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';
import _ from 'lodash';

import {
    getItemLabelByNameAndType,
    getReadonlyReasonForSessionAndType
} from '../../../utils/stringUtils';
import {
    filterBuilderStartEdit,
    filterBuilderDeleteFilter
} from '../../../actions/filterBuilder';


export default class ExistentFilterSelect extends Component {

    render() {
        const {auth, fields} = this.props;
        const selectedFilter = this.props.filterBuilder.editingFilter.filter;
        const {filters} = this.props.filtersList;
        const isDemoSession = auth.isDemo;
        const isFilterEditable = selectedFilter.type === 'user';

        return (
            <div className='in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle()}
                </div>
                {this.renderWarning(isDemoSession, selectedFilter.type)}
                <div className='row grid-toolbar row-head-selector'>
                    {this.renderFiltersSelector(filters, fields)}
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

    renderFiltersSelector(filters, fields) {
        const selectItems = filters.map( filter => ({
            value: filter.id,
            label: getItemLabelByNameAndType(filter.name, filter.type)
        }));

        return (
            <div className='col-sm-6'>
                <Select
                    options={selectItems}
                    value={this.getSelectedFilter().id}
                    onChange={(val) => this.onSelectChange(filters, val.value, fields)}
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

    onSelectChange(filters, filterId, fields) {
        this.props.dispatch(filterBuilderStartEdit(false, _.find(filters, {id: filterId}) || null, fields));
    }

    onDuplicateClick() {
        const filter = this.getSelectedFilter();
        const fields = this.props.fields;
        this.props.dispatch(filterBuilderStartEdit(true, filter, fields));
    }

    onResetFilterClick() {
        const filter = this.getSelectedFilter();
        const fields = this.props.fields;
        this.props.dispatch(filterBuilderStartEdit(false, filter, fields));
    }

    onDeleteFilterClick() {
        const filterId = this.getSelectedFilter().id;
        this.props.dispatch(filterBuilderDeleteFilter(filterId));
    }

}
