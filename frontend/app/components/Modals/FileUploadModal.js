import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import FileUploadHeader from './FileUpload/FileUploadHeader';
import FileUploadFooter from './FileUpload/FileUploadFooter';
import FileUpload from './FileUpload/FileUpload';
import FileUploadSamples from './FileUpload/FileUploadSamples';

class FileUploadModal extends Component {
    render() {
        return (
            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={this.props.showModal}
                onHide={ () => this.props.closeModal('upload') }
            >
                <FileUploadHeader />
                <Modal.Body>
                    <div className='modal-body-scroll'>
                        <div className='modal-padding'>
                            <FileUpload {...this.props} />
                            <FileUploadSamples {...this.props} />
                        </div>
                    </div>
                </Modal.Body>
                <FileUploadFooter {...this.props} />
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    const {auth, ui, fileUpload, samplesList: {samples}, fields: {editableFields}} = state; // TODO sl hashedArray

    return {
        auth,
        ui,
        fileUpload,
        samples,  // TODO sl not whole samplesList?x
        editableFieldsList: editableFields
    };
}

export default connect(mapStateToProps)(FileUploadModal);
