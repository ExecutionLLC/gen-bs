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
                dialogClassName='modal-dialog-primary modal-columns'
                bsSize='lg'
                show={showModal}
                onHide={ () => this.onClose()}
                backdrop='static'
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
                    editingSample={this.props.editingSample}
                    currentHistorySamplesIds={this.props.currentHistorySamplesIds}
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
    const {auth, ui, fileUpload, analysesHistory: {newHistoryItem}, samplesList, fields: {editableFields}} = state;
    const currentHistorySamplesIds = newHistoryItem ? _.map(newHistoryItem.samples, sample => sample.id) : [];
    return {
        auth,
        ui,
        fileUpload,
        samplesList,
        currentHistorySamplesIds,
        editableFieldsList: editableFields,
        sampleSearch: samplesList.search,
        currentSampleId: samplesList.currentSampleId,
        editingSample: samplesList.editingSample
    };
}

export default connect(mapStateToProps)(FileUploadModal);
