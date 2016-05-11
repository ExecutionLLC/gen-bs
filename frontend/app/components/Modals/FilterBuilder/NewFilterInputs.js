import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

import { filterBuilderChangeAttr, filterBuilderStartEdit } from '../../../actions/filterBuilder'


export default class NewFilterInputs extends Component {

    render() {
        const { dispatch, showModal, closeModal, fields } = this.props
        const { filters } = this.props.userData
        const editingFilter = this.props.filterBuilder.editingFilter.filter;

        return (

            <div className="collapse in copyview">
                <div className="row grid-toolbar row-noborder row-new-item">
                    <div className="col-sm-6">
                        <label data-localize="views.setup.new.name.title">New View</label>
                        <input
                            type="text"
                            className="form-control text-primary"
                            data-localize="views.setup.new.name.help"
                            placeholder="Set view name a copy"
                            value={editingFilter.name}
                            onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: e.target.value, description: editingFilter.description })) }
                        />

                        { !editingFilter.name &&
                        <div className="help-text text-danger" data-localize="views.setup.new.name.error">
                            Filter name cannot be empty
                        </div>
                        }

                    </div>
                    <div className="col-sm-6">
                        <label data-localize="general.description">Description</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                data-localize="views.setup.new.description"
                                placeholder="Set view description (optional)"
                                value={editingFilter.description}
                                onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: editingFilter.name, description: e.target.value})) }
                            />
                            <div className="input-group-btn  btn-group-close">
                                <button type="button" className="btn-link-default" type="button"
                                        onClick={ () => dispatch(filterBuilderStartEdit(false, editingFilter, fields)) }><i className="md-i">close</i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        )
    }
}
