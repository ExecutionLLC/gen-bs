import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

class AutoLogoutModal extends Component {
    renderHeader() {
        return (
            <Modal.Header>
                <Modal.Title data-localize='autoLogout.heading'>
                    Auto Logout
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        return (
            <Modal.Body>
                Your session will be automatically closed after {this.props.secondsToAutoLogout} seconds.
            </Modal.Body>
        );
    }

    renderFooter() {
        return (
            <Modal.Footer>
                <button
                    onClick={ () => this.props.closeModal() }
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                    localize-data='action.extendSession'
                >
                    <span>Extend session</span>
                </button>
            </Modal.Footer>
        );
    }

    render() {
        return (
            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={this.props.showModal}
                onHide={ () => this.props.closeModal() }
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
    const {auth: {secondsToAutoLogout}} = state;
    return {
        secondsToAutoLogout
    };
}

export default connect(mapStateToProps)(AutoLogoutModal);
