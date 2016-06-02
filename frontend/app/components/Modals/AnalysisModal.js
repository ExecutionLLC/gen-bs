import React from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

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
                <Modal.Header closeButton>
                    <Modal.Title>
                        Analysis
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
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
