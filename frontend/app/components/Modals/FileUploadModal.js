import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import { fetchFields } from '../../actions/fields';

import FileUploadHeader from './FileUpload/FileUploadHeader';
import FileUploadFooter from './FileUpload/FileUploadFooter';
import FileUpload from './FileUpload/FileUpload';
import FileUploadSamples from './FileUpload/FileUploadSamples'

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
            <FileUploadSamples {...this.props} />
          </Modal.Body>
          <FileUploadFooter {...this.props} />
        </Modal>
    )
  }
}

function mapStateToProps(state) {
  const { ui, fileUpload, userData: { samples }, fields: { list } } = state;

  return {
    ui,
    fileUpload,
    samples,
    editableFieldsList: _.filter(list, 'is_editable', true)
  }
}

export default connect(mapStateToProps)(FileUploadModal)

