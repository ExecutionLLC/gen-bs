import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames';

import {uploadFile} from '../../../actions/fileUpload';
import _ from 'lodash';


export default class FileUploadFooter extends Component {

    render() {

        const {dispatch, closeModal} = this.props;
        const {filesProcesses} = this.props.fileUpload;

        const isEnabledForMultiFile = _.some(filesProcesses, {isUploaded: false, isUploading: false, isArchived: true});

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
                    disabled={!isEnabledForMultiFile}
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
