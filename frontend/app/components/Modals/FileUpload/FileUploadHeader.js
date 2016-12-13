import React from 'react';
import {Modal} from 'react-bootstrap';


export default class FileUploadHeader extends React.Component {

    render() {
        const {showUploadHide, onUploadHide} = this.props;

        return (

            <Modal.Header closeButton>
                <Modal.Title >
                    {showUploadHide &&
                    <button
                        className='btn btn-link-inverse btn-back-to-left'
                        type='button'
                        id='backToSplitLeft'
                        onClick={onUploadHide}
                    >
                        <i className='md-i'>keyboard_backspace</i>
                    </button>
                    }
                    <span className='modal-title-text'>Samples</span>
                </Modal.Title>
            </Modal.Header>

        );
    }
}
