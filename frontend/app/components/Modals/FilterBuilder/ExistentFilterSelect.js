import React, {Component} from 'react';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
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
                {this.renderDescription(isDemoSession, selectedFilter.type)}
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

    renderDescription(isDemoSession, selectedFilterType) {
        const descriptionText = getReadonlyReasonForSessionAndType('filter', isDemoSession, selectedFilterType);

        if (descriptionText) {
            return (
                <div className='alert alert-help'>
                    <span data-localize='filters.setup.selector.description'>
                        {descriptionText}
                    </span>
                </div>
            );
        }

        return null;
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
                    onClick={() => this.onDuplicateClick(this.getSelectedFilter(), this.props.fields)}
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
                    onClick={() => this.onResetFilterClick(this.getSelectedFilter(), this.props.fields)}
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
                    onClick={() => this.onDeleteFilterClick(this.getSelectedFilter().id)}
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

    onDuplicateClick(filter, fields) {
        this.props.dispatch(filterBuilderStartEdit(true, filter, fields));
    }

    onResetFilterClick(filter, fields) {
        this.props.dispatch(filterBuilderStartEdit(false, filter, fields));
    }

    onDeleteFilterClick(filterId) {
        this.props.dispatch(filterBuilderDeleteFilter(filterId));
    }

}
