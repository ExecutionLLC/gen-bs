import React from 'react';
import {Modal} from 'react-bootstrap';


export default class AnalysisHeader extends React.Component {
    render() {
        return (
            <Modal.Header closeButton>
                <Modal.Title>
                    Analyses
                </Modal.Title>
            </Modal.Header>
        );
    }
}
