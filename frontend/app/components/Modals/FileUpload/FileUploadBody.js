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
            currentSampleId, auth, closeModal, editedSamplesHash,currentHistorySamplesIds
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
                    />
                    <FileUploadSampleRightPane
                        dispatch={dispatch}
                        currentSampleId={currentSampleId}
                        samplesHash={editedSamplesHash}
                        auth={auth}
                        fields={editableFieldsList}
                        closeModal={closeModal}
                        fileUpload={fileUpload}
                        edited={this.state.showValues}
                        changeShowValues={(e) => this.setShowValuesState(e)}
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
}