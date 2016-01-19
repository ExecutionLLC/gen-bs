import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

//import { filterBuilderUpdateFilter, filterBuilderCreateFilter } from '../../../actions/filterBuilder';


export default class FilterBuilderFooter extends Component {

  render() {

    const { dispatch, closeModal } = this.props
    //const { editOrNew } = this.props.viewBuilder

    return (

        <Modal.Footer>
          <button
            onClick={ () => { this.props.closeModal('filters')} }
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            <span  data-localize="actions.cancel" />Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
          >
            <span data-localize="actions.save_select.title">Save and Select</span>
          </button>
         </Modal.Footer>

    )
  }
}
