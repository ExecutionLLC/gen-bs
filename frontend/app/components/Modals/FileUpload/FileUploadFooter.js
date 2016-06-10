import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import _ from 'lodash';

import {uploadFile} from '../../../actions/fileUpload';


export default class FileUploadFooter extends Component {

    render() {

        const {dispatch} = this.props;
        const {filesProcesses} = this.props.fileUpload;

        const isUploadEnabled = _.some(filesProcesses, {isUploaded: false, isUploading: false, isArchived: true});

        return (

            <Modal.Footer>
                <button
                    onClick={ () => this.props.closeModal('upload') }
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                >
                    <span data-localize='actions.cancel'/>Cancel
                </button>

                <button
                    disabled={!isUploadEnabled}
                    onClick={ () => {
                        dispatch(uploadFile());
                    }}
                    type='button'
                    className='btn btn-primary'
                >
                    <span data-localize='actions.save_select.title'>Upload</span>
                </button>
            </Modal.Footer>

        );
    }
}
