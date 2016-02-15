import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import FileUploadHeader from './FileUpload/FileUploadHeader';
import FileUploadFooter from './FileUpload/FileUploadFooter';
import FileUpload from './FileUpload/FileUpload';


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
            <FileUpload {...this.props} />
          </Modal.Body>
          <FileUploadFooter {...this.props} />
        </Modal>
    )
  }
}

function mapStateToProps(state) {
  const { ui, fileUpload } = state

  return {
    ui,
    fileUpload
  }
}

export default connect(mapStateToProps)(FileUploadModal)

