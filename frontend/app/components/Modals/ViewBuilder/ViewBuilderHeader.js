import React from 'react';
import {Modal} from 'react-bootstrap';


export default class ViewBuilderHeader extends React.Component {
    render() {
        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize='views.heading'>
                    Setup Views
                </Modal.Title>
            </Modal.Header>
        );
    }
}
