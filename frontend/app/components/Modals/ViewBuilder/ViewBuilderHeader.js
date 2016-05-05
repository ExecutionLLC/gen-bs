import React from 'react';
import {Modal} from 'react-bootstrap';


export default class ViewBuilderHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize='views.heading'>
                    Setup Views
                </Modal.Title>
            </Modal.Header>
        )
    }
}
