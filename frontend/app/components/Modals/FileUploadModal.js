import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import FileUploadHeader from './FileUpload/FileUploadHeader';
import FileUploadBody from './FileUpload/FileUploadBody';

class FileUploadModal extends Component {
    render() {
        const {showModal} = this.props;
        return (
            <Modal
                id='file-upload-modal'
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={ () => this.onClose()}
            >
                <FileUploadHeader />
                <FileUploadBody
                    dispatch={this.props.dispatch}
                    fileUpload={this.props.fileUpload}
                    editableFieldsList={this.props.editableFieldsList}
                    samplesList={this.props.samplesList}
                    sampleSearch={this.props.sampleSearch}
                    currentSampleId={this.props.currentSampleId}
                    auth={this.props.auth}
                    editedSamplesHash={this.props.editedSamplesHash}
                    closeModal={ () => this.onClose() }
                />
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal('upload');
    }
}

function mapStateToProps(state) {
    const {auth, ui, fileUpload, samplesList, fields: {editableFields}} = state;
    return {
        auth,
        ui,
        fileUpload,
        samplesList,
        editableFieldsList: editableFields,
        sampleSearch: samplesList.search,
        currentSampleId: samplesList.currentSampleId,
        editedSamplesHash: samplesList.editedSamplesHash
    };
}

export default connect(mapStateToProps)(FileUploadModal);
