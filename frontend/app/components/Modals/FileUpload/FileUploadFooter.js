import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { uploadFile } from '../../../actions/fileUpload';


export default class FileUploadFooter extends Component {

  render() {

    const { dispatch, closeModal } = this.props;
    const { files, isFetching } = this.props.fileUpload;

    var disabledClass = classNames({
      'disabled': (files.length === 0)||(isFetching) ? 'disabled':''
    });



    return (

        <Modal.Footer>
          <button
              onClick={ () => { this.props.closeModal('upload')} }
              type='button'
              className='btn btn-default'
              data-dismiss='modal'
          >
              <span data-localize='actions.cancel'/>Cancel
          </button>

          <button
              disabled={disabledClass}
              onClick={ () => {
              dispatch(uploadFile())
            }}
              type='button'
              className='btn btn-primary'
          >
              <span data-localize='actions.save_select.title'>Upload</span>
          </button>
         </Modal.Footer>

    )
  }
}
