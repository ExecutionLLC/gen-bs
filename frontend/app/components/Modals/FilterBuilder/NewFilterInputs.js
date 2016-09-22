import React, {Component} from 'react';

import {filterBuilderChangeAttr, filterBuilderStartEdit} from '../../../actions/filterBuilder';
import config from '../../../../config';

export default class NewFilterInputs extends Component {

    render() {

        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        const {validationMessage} = this.props;

        return (
            <div className='form-rows-dynamic collapse in'>
                { validationMessage &&
                <div className='alert alert-help'>
                        <span data-localize='filters.setup.selector.description'>
                            {validationMessage}
                        </span>
                </div>
                }
                <div className='form-group row-new-item'>
                    <div className='col-sm-6'>
                        <label data-localize='filters.setup.new.name.title'>New Filter</label>
                        <input
                            type='text'
                            className='form-control text-primary'
                            data-localize='filters.setup.new.name.help'
                            placeholder='Set filter name'
                            value={editingFilter.name}
                            maxLength={config.FILTERS.MAX_NAME_LENGTH}
                            onChange={(e) => this.onNameChange(e.target.value)}
                        />
                    </div>
                    <div className='col-sm-6 input-group'>
                        <label data-localize='general.description'>Description</label>
                        <input
                            type='text'
                            className='form-control'
                            data-localize='filters.setup.new.description'
                            placeholder='Set filter description (optional)'
                            value={editingFilter.description}
                            maxLength={config.FILTERS.MAX_DESCRIPTION_LENGTH}
                            onChange={(e) => this.onDescriptionChange(e.target.value)}
                        />
                        <div className='input-group-btn'>
                            <button type='button' className='btn btn-link-default'
                                    onClick={() => this.onCancelClick()}>
                                <i className='md-i'>close</i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    onNameChange(name) {
        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        this.props.dispatch(filterBuilderChangeAttr({
            name,
            description: editingFilter.description
        }));
    }

    onDescriptionChange(description) {
        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        this.props.dispatch(filterBuilderChangeAttr({
            name: editingFilter.name,
            description
        }));
    }

    onCancelClick() {
        const parentFilter = this.props.filtersList.hashedArray.hash[this.props.filterBuilder.editingFilter.parentFilterId];
        this.props.dispatch(filterBuilderStartEdit(false, parentFilter, this.props.fields));
    }

}
