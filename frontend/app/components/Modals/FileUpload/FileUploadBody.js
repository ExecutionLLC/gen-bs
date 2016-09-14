import React from 'react';
import {Modal} from 'react-bootstrap';
import FileUploadLeftPane from './FileUploadLeftPane';
import FileUploadSampleRightPane from './FileUploadSampleRightPane';

export default class FileUploadBody extends React.Component {

    render() {
        const {
            dispatch, fileUpload, editableFieldsList, samplesList,
            sampleSearch, currentSampleId, auth, closeModal
        } = this.props;
        const {hashedArray:{hash}} = samplesList;
        const selectedSample = currentSampleId? hash[currentSampleId]:null;
        debugger;
        return (
            <Modal.Body>
                <div className='split-layout'>
                    <div className='split-left'>
                            <FileUploadLeftPane
                                dispatch={dispatch}
                                fileUpload={fileUpload}
                                samplesList={samplesList}
                                sampleSearch={sampleSearch}
                                currentSampleId={currentSampleId}
                            />
                    </div>
                    <div className='split-right tab-content'>
                        <div className='split-wrap tab-pane active'>
                            <FileUploadSampleRightPane
                                dispatch={dispatch}
                                selectedSample={selectedSample}
                                samplesList={samplesList}
                                auth={auth}
                                fields={editableFieldsList}
                                disabled={!!currentSampleId}
                                closeModal={closeModal}
                                fileUpload={fileUpload}
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        );
    }
}