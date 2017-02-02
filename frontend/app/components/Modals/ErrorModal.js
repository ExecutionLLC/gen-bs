import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import {getP} from 'redux-polyglot/dist/selectors';


class ErrorModal extends Component {
    renderHeader() {
        const {p} = this.props;
        return (
            <Modal.Header>
                <Modal.Title data-localize='error.heading'>
                    {p.t('errors.errorTitle')}
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        const {lastError, p} = this.props;
        var errorMessage = p.t('errors.unknownError');
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
        const {closeModal, p} = this.props;
        return (
            <Modal.Footer>
                <button
                    onClick={closeModal}
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                >
                    <span>{p.t('errors.buttonClose')}</span>
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
        lastError,
        p: getP(state)
    };
}

export default connect(mapStateToProps)(ErrorModal);
