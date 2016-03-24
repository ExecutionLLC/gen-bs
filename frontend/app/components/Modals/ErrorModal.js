import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';

import { lastErrorResolved } from '../../actions/errorHandler'

export default class ErrorModal extends Component {
    renderButton(label, localize, action, isDefault) {
        const classNameData = "btn" + (isDefault ? " btn-default" : "");
        const localizeData = localize || "";
        return (
            <button
             onClick={ action }
             type="button"
             className={ classNameData }
             data-dismiss="modal"
             localize-data={ localizeData }
            >
                <span>{ label }</span>
            </button>
        )
    }

    renderHeader() {
        return (
            <Modal.Header>
                <Modal.Title data-localize="error.heading">
                    Error
                </Modal.Title>
            </Modal.Header>
        )
    }

    renderBody() {
        var errorMessage = "Unknown error";
        if (this.props.lastError && this.props.lastError.errorMessage) {
            errorMessage = this.props.lastError.errorMessage;
        }
        return (
            <Modal.Body>
                {errorMessage}
            </Modal.Body>
        )
    }

    renderFooter() {
        return (
            <Modal.Footer>
                { this.renderButton("Close", "action.close", this.props.closeModal, true) }
            </Modal.Footer>
        )
    }

    render() {
        return (
            <Modal
                dialogClassName="modal-dialog-primary"
                bsSize="lg"
                show={this.props.showModal}
                onHide={ () => {this.props.closeModal()} }
            >
            { this.renderHeader() }
            { this.renderBody() }
            { this.renderFooter() }
            </Modal>
        )
    }
}

function mapStateToProps(state) {
    const { errorHandler: { lastError } } = state;
    return {
        lastError
    }
}

export default connect(mapStateToProps)(ErrorModal);
