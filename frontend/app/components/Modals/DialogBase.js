import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

export default class DialogBase extends Component {
    constructor(props, dialogName) {
        super(props);
    }

    renderTitleContents() {
        return (
            <div>Sample Dialog Title</div>
        );
    }

    renderBodyContents() {
        return (
            <div>Dialog body contents go here.</div>
        );
    }

    renderFooterContents() {
        return (
            <button
                onClick={ () => {this.onCloseModal()} }
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
                localize-data="action.extendSession"
            >
                <span>Ok</span>
            </button>
        );
    }

    renderHeader() {
        return (
            <Modal.Header>
                <Modal.Title>
                    {this.renderTitleContents()}
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        return (
            <Modal.Body>
                {this.renderBodyContents()}
            </Modal.Body>
        );
    }

    renderFooter() {
        return (
            <Modal.Footer>
                {this.renderFooterContents()}
            </Modal.Footer>
        );
    }

    onCloseModal() {
        console.error('The method should be overridden');
    }

    render() {
        return (
            <Modal dialogClassName="modal-dialog-primary"
                   bsSize="lg"
                   show={this.props.showModal}
                   onHide={ () => {this.onCloseModal()} }
            >
                {this.renderHeader()}
                {this.renderBody()}
                {this.renderFooter()}
            </Modal>
        );
    }
}

DialogBase.propTypes = {
    savedFiles: React.PropTypes.array.isRequired,
    showModal: React.PropTypes.bool.isRequired
};
