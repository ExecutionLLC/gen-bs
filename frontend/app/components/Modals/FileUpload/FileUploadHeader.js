import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


export default class FileUploadHeader extends Component {

  render() {
    return (

          <Modal.Header closeButton>
            <Modal.Title data-localize="views.heading">
              Upload vcf 
            </Modal.Title>
          </Modal.Header>

    )
  }
}
