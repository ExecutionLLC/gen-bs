import React from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import AnalysisHeader from './Analysis/AnalysisHeader';

class AnalysisModal extends React.Component {
    render() {
        const {showModal} = this.props;

        return (
            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
            >
                <AnalysisHeader />
                <Modal.Body>
                </Modal.Body>
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal();
    }
}

function mapStateToProps(state) {
    const {auth} = state;

    return {
        auth
    };
}

export default connect(mapStateToProps)(AnalysisModal);
