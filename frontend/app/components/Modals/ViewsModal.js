import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import { viewBuilderSelectView } from '../../actions/viewBuilder'
import { viewBuilderChangeColumn } from '../../actions/viewBuilder'

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader'
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter'
import NewView from './ViewBuilder/NewView'
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect'
import ViewForm from './ViewBuilder/ViewForm'

class ViewsModal extends Component {


  render() {
    console.log('view modal props', this.props)

    const { dispatch, showModal, closeModal } = this.props
    const { currentSample, currentView } = this.props.ui
    const { samples, views, isValid } = this.props.userData
    const { isEditOrNew, editedView, newView } = this.props.viewBuilder

    return (

      
        <Modal
          dialogClassName="modal-dialog-primary"
          bsSize="lg"
          show={this.props.showModal}
          onHide={ () => {this.props.closeModal('views')} }
        >
            { !isValid &&
              <div >&nbsp;</div>
            }
            { isValid &&
              <div>
                  <ViewBuilderHeader />
                  <form>
                    <Modal.Body>
                      {
                        //<NewView />
                      }
                        <ExistentViewSelect {...this.props} />
                        <ViewForm
                          {...this.props}
                        />
                    </Modal.Body>
                    <ViewBuilderFooter {...this.props} />
                  </form>
              </div>
            }
        </Modal>

    )
  }
}

function mapStateToProps(state) {
  const { viewBuilder, ui, userData, fields } = state

  return {
    userData,
    fields,
    ui,
    viewBuilder
  }
}

export default connect(mapStateToProps)(ViewsModal)

