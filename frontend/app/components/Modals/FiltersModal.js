
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader'
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter'
import QueryBuilder from './FilterBuilder/QueryBuilder'

class FiltersModal extends Component {
  render() {

    const { dispatch, showModal, closeModal } = this.props
    const { currentSample, currentFilter } = this.props.ui
    const { samples, views, isValid } = this.props.userData
    //const { editOrNew, editedView, newView } = this.props.viewBuilder

    return (

      
        <Modal
          dialogClassName="modal-dialog-primary"
          bsSize="lg"
          show={this.props.showModal}
          onHide={ () => {this.props.closeModal('filters')} }
        >
            { !isValid &&
              <div >&nbsp;</div>
            }
            { isValid &&
              <div>
                  <FilterBuilderHeader />
                    <form>
                      <Modal.Body>
                        < QueryBuilder />
                      </Modal.Body>
                      <FilterBuilderFooter {...this.props} />
                    </form>
              </div>
            }
        </Modal>

    )
  }
}


function mapStateToProps(state) {
  const { filterBuilder, ui, userData, fields } = state

  return {
    userData,
    fields,
    ui,
    filterBuilder
  }
}

export default connect(mapStateToProps)(FiltersModal)

