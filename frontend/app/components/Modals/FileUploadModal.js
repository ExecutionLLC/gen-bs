import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import FileUploadHeader from './FileUpload/FileUploadHeader';


class FileUploadModal extends Component {
  render() {

    return (
        <Modal
          dialogClassName="modal-dialog-primary"
          bsSize="lg"
          show={this.props.showModal}
          onHide={ () => {this.props.closeModal('upload')} }
        >
          <FileUploadHeader />
          <Modal.Body>
            <div>
              <h1>FileUpload</h1>
            </div>
          </Modal.Body>
        </Modal>
    )
  }
}

function mapStateToProps(state) {
  const { ui, userData, fields } = state

  return {
    userData,
    fields,
    ui
  }
}

export default connect(mapStateToProps)(FileUploadModal)

