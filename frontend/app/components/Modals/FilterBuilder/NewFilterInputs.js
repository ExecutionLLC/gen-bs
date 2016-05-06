import React, {Component} from 'react';

import {filterBuilderChangeAttr, filterBuilderToggleNewEdit} from '../../../actions/filterBuilder';


export default class NewFilterInputs extends Component {

    render() {
        const {dispatch, fields} = this.props;
        const editingFilter = this.props.filterBuilder.editingFilter.filter;

        return (

            <div className='collapse in copyview'>
                <div className='row grid-toolbar'>

                    <div className='col-sm-6'>
                        <label data-localize='views.setup.new.name.title'>New View</label>
                        <input
                            type='text'
                            className='form-control text-primary'
                            data-localize='views.setup.new.name.help'
                            placeholder='Set view name a copy'
                            value={editingFilter.name}
                            onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: e.target.value, description: editingFilter.description })) }
                        />

                        { !editingFilter.name &&
                        <div className='help-text text-danger' data-localize='views.setup.new.name.error'>
                            Filter name cannot be empty
                        </div>
                        }

                    </div>

                    <div className='col-sm-5'>
                        <label data-localize='general.description'>Description</label>
                        <input
                            type='text'
                            className='form-control'
                            data-localize='views.setup.new.description'
                            placeholder="Set view description (optional)"
                            value={editingFilter.description}
                            onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: editingFilter.name, description: e.target.value})) }
                        />
                    </div>

                    <div className='col-sm-1'>
                        <button type='button' className='btn btn-default btn-label-indent delete-copy' type='button'
                                onClick={ () => dispatch(filterBuilderToggleNewEdit(false, fields)) }><span
                            data-localize='actions.cancel'>Cancel</span></button>
                    </div>

                </div>
            </div>

        )
    }
}
