import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';

import {filterBuilderChangeAttr, filterBuilderStartEdit} from '../../../actions/filterBuilder'


export default class NewFilterInputs extends Component {

    onNameChange(name) {
        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        this.props.dispatch(filterBuilderChangeAttr({
            name: name,
            description: editingFilter.description
        }));
    }

    onDescriptionChange(description) {
        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        this.props.dispatch(filterBuilderChangeAttr({
            name: editingFilter.name,
            description: description
        }));
    }

    onCancelClick() {
        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        this.props.dispatch(filterBuilderStartEdit(false, editingFilter, this.props.fields));
    }

    render() {
        const {dispatch, fields} = this.props;
        const {filters} = this.props.userData;
        const editingFilter = this.props.filterBuilder.editingFilter.filter;

        const filterNameExists = _.some(filters, filter => filter.name == editingFilter.name);
        const descriptionText = (filterNameExists) ? 'Filter with this name is already exists.' : '';

        return (

            <div className="collapse in copyview">
                { descriptionText &&
                <div className="alert alert-help">
                        <span data-localize="views.setup.selector.description">
                            {descriptionText}
                        </span>
                </div>
                }
                <div className="row grid-toolbar row-noborder row-new-item">

                    <div className="col-sm-6">
                        <label data-localize="views.setup.new.name.title">New View</label>
                        <input
                            type="text"
                            className="form-control text-primary"
                            data-localize="views.setup.new.name.help"
                            placeholder="Set view name a copy"
                            value={editingFilter.name}
                            onChange={(e) => this.onNameChange(e.target.value)}
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
                                onChange={(e) => this.onDescriptionChange(e.target.value)}
                            />
                            <div className="input-group-btn  btn-group-close">
                                <button type="button" className="btn-link-default" type="button"
                                        onClick={() => this.onCancelClick()}>
                                    <i className="md-i">close</i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        )
    }
}
