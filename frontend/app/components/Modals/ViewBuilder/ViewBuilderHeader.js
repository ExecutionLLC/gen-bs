import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


export default class ViewBuilderHeader extends Component {

  render() {
    return (

          <Modal.Header closeButton>
            <Modal.Title data-localize="views.heading">
              Setup views
            </Modal.Title>
          </Modal.Header>

    )
  }
}
