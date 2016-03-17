import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { filterBuilderRequestRules } from '../../../actions/filterBuilder';


export default class FilterBuilderFooter extends Component {

  render() {

    const { dispatch, auth, closeModal } = this.props
    const { editOrNew, editedFilter, newFilter } = this.props.filterBuilder
    const filter = editOrNew ? (editedFilter):(newFilter)

    var disabledClass = classNames({
      'disabled': (filter.type === 'advanced' && auth.isDemo) ? 'disabled':''
    })
      var title = (filter.type === 'advanced' && auth.isDemo) ? 'Login or registry to select advanced filters':''


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
            disabled={disabledClass}
            title={title}
            onClick={ () => {
              dispatch(filterBuilderRequestRules())
            }}
            type="button"
            className="btn btn-primary"
          >
            <span data-localize="actions.save_select.title">Save and Select</span>
          </button>
         </Modal.Footer>

    )
  }
}
