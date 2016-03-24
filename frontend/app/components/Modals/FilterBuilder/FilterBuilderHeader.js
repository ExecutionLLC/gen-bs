import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


export default class FilterBuilderHeader extends Component {
    render() {
        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize="filters.heading">
                    Setup filters
                </Modal.Title>
            </Modal.Header>
        )
    }
}
