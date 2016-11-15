import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

class ErrorModal extends Component {
    renderHeader() {
        return (
            <Modal.Header>
                <Modal.Title data-localize='error.heading'>
                    Error
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        const {lastError} = this.props;
        var errorMessage = 'Unknown error';
        if (lastError && lastError.errorMessage) {
            errorMessage = lastError.errorMessage;
        }
        return (
            <Modal.Body>
                {errorMessage}
            </Modal.Body>
        );
    }

    renderFooter() {
        const {closeModal} = this.props;
        return (
            <Modal.Footer>
                <button
                    onClick={closeModal}
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                    localize-data='action.close'
                >
                    <span>Close</span>
                </button>
            </Modal.Footer>
        );
    }

    render() {
        const {showModal, closeModal} = this.props;
        return (
            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={closeModal}
                backdrop='static'
            >
                { this.renderHeader() }
                { this.renderBody() }
                { this.renderFooter() }
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    const {errorHandler: {lastError}} = state;
    return {
        lastError
    };
}

export default connect(mapStateToProps)(ErrorModal);
