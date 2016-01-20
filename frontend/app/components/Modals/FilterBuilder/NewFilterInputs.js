import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

import { filterBuilderChangeAttr, filterBuilderToggleNewEdit } from '../../../actions/filterBuilder'


export default class NewFilterInputs extends Component {

  render() {

    const { dispatch, showModal, closeModal } = this.props
    const { filters } = this.props.userData
    const { newFilter } = this.props.filterBuilder

    return (

        <div className="collapse in copyview">
          <div className="row grid-toolbar">

            <div className="col-sm-6">
              <label data-localize="views.setup.new.name.title">New View</label> 
              <input
                type="text"
                className="form-control text-primary"
                data-localize="views.setup.new.name.help"
                placeholder="Set view name a copy"
                value={newFilter.name}
                onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: e.target.value, desctription: newFilter.desctription, })) }
              />

              <div className="help-text text-danger" data-localize="views.setup.new.name.error">Name can not be empty</div>
            </div>

          <div className="col-sm-5">
            <label data-localize="general.description">Description</label>
            <input
              type="text"
              className="form-control"
              data-localize="views.setup.new.description"
              placeholder="Set view description (optional)"
              value={newFilter.description}
              onChange={ (e) =>dispatch(filterBuilderChangeAttr({name: newFilter.name, description: e.target.value})) }
            />
          </div>

          <div className="col-sm-1">
            <button type="button" className="btn btn-default btn-label-indent delete-copy" type="button" data-toggle="collapse" data-target=".copyview "  onClick={ () => dispatch(filterBuilderToggleNewEdit(true)) } ><span data-localize="actions.cancel">Cancel</span></button> 
          </div>

        </div>
      </div> 

    )
  }
}
