import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import FileUploadHeader from './FileUpload/FileUploadHeader';
import FileUploadBody from './FileUpload/FileUploadBody';
import {modalName} from '../../actions/modalWindows';
import {getP} from 'redux-polyglot/dist/selectors';

class FileUploadModal extends Component {
    constructor(props) {
        super(props);
        this.state = {isUploadBringToFront: false};
    }

    render() {
        const {showModal, ui: {languageId}} = this.props;
        return (
            <Modal
                id='file-upload-modal'
                dialogClassName='modal-dialog-primary modal-columns'
                bsSize='lg'
                show={showModal}
                onHide={ () => this.onClose()}
                backdrop='static'
            >
                <FileUploadHeader
                    showUploadHide={this.state.isUploadBringToFront}
                    onUploadHide={() => this.onUploadHide()}
                    p={this.props.p}
                />
                <FileUploadBody
                    dispatch={this.props.dispatch}
                    languageId={languageId}
                    fileUpload={this.props.fileUpload}
                    editableFieldsList={this.props.editableFieldsList}
                    samplesList={this.props.samplesList}
                    sampleSearch={this.props.sampleSearch}
                    currentSampleId={this.props.currentSampleId}
                    auth={this.props.auth}
                    editingSample={this.props.editingSample}
                    currentHistorySamplesIds={this.props.currentHistorySamplesIds}
                    closeModal={ () => this.onClose() }
                    isUploadBringToFront={this.state.isUploadBringToFront}
                    onUploadShow={() => this.onUploadShow()}
                    onUploadHide={() => this.onUploadHide()}
                    p={this.props.p}
                />
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal();
    }

    onUploadShow() {
        this.setState({isUploadBringToFront: true});
    }

    onUploadHide() {
        this.setState({isUploadBringToFront: false});
    }
}

function mapStateToProps(state) {
    const {auth, fileUpload, analysesHistory: {newHistoryItem}, samplesList, metadata: {editableMetadata: editableFields}, ui} = state;
    const currentHistorySamplesIds = newHistoryItem ? _.map(newHistoryItem.samples, sample => sample.id) : [];
    return {
        auth,
        fileUpload,
        samplesList,
        currentHistorySamplesIds,
        editableFieldsList: editableFields,
        sampleSearch: samplesList.search,
        currentSampleId: samplesList.currentSampleId,
        editingSample: samplesList.editingSample,
        ui,
        p: getP(state)
    };
}

FileUploadModal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(FileUploadModal);
