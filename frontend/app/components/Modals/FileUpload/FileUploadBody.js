import React from 'react';
import {Modal} from 'react-bootstrap';
import FileUploadLeftPane from './FileUploadLeftPane';
import FileUploadSampleRightPane from './FileUploadSampleRightPane';

export default class FileUploadBody extends React.Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    render() {
        const {
            dispatch, fileUpload, editableFieldsList, samplesList,
            currentSampleId, auth, closeModal, currentHistorySamplesIds,
            onUploadHide
        } = this.props;
        return (
            <Modal.Body>
                <div id='samplesLayout' className='split-layout'>
                    <FileUploadLeftPane
                        dispatch={dispatch}
                        fileUpload={fileUpload}
                        samplesList={samplesList}
                        currentSampleId={currentSampleId}
                        changeShowValues={(e) => this.setShowValuesState(e)}
                        editableFields={editableFieldsList}
                        currentHistorySamplesIds={currentHistorySamplesIds}
                        closeModal={closeModal}
                        onSelectUpload={() => this.onSelectUpload()}
                    />
                    <FileUploadSampleRightPane
                        dispatch={dispatch}
                        currentSampleId={currentSampleId}
                        samplesList={samplesList}
                        auth={auth}
                        fields={editableFieldsList}
                        closeModal={closeModal}
                        fileUpload={fileUpload}
                        edited={this.state.showValues}
                        changeShowValues={(e) => this.setShowValuesState(e)}
                        isBringToFront={this.props.isUploadBringToFront}
                        onUploadHide={onUploadHide}
                    />
                </div>
            </Modal.Body>
        );
    }

    setShowValuesState(showValues) {
        this.setState({
            showValues
        });
    }

    onSelectUpload() {
        const {onUploadShow} = this.props;
        onUploadShow();
    }
}