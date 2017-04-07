import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import {getP} from 'redux-polyglot/dist/selectors';


class AutoLogoutModal extends Component {
    renderHeader() {
        const {p} = this.props;
        return (
            <Modal.Header>
                <Modal.Title>
                    {p.t('autoLogout.title')}
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        const {secondsToAutoLogout, p} = this.props;
        return (
            <Modal.Body>
                {p.t('autoLogout.text', {secs: secondsToAutoLogout})}
            </Modal.Body>
        );
    }

    renderFooter() {
        const {closeModal, p}  = this.props;
        return (
            <Modal.Footer>
                <button
                    onClick={closeModal}
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                >
                    <span>{p.t('autoLogout.buttonExtend')}</span>
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

AutoLogoutModal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired
};

function mapStateToProps(state) {
    const {auth: {secondsToAutoLogout}} = state;
    return {
        secondsToAutoLogout,
        p: getP(state)
    };
}

export default connect(mapStateToProps)(AutoLogoutModal);
