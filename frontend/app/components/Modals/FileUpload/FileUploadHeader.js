import React from 'react';
import {Modal} from 'react-bootstrap';


export default class FileUploadHeader extends React.Component {

    render() {
        return (

            <Modal.Header closeButton>
                <Modal.Title >
                    Upload VCF Files
                </Modal.Title>
            </Modal.Header>

        );
    }
}
