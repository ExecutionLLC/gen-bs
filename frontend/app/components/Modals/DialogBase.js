import React from 'react';
import {Modal} from 'react-bootstrap';
import classnames from 'classnames';

import ComponentBase from '../shared/ComponentBase';

export default class DialogBase extends ComponentBase {
    constructor(props) {
        super(props);
    }

    getBodyClassNames() {
        return [];
    }

    getModalClassNames() {
        return [];
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
                onClick={ () => this.onCloseModal() }
                type='button'
            >
                <span>Ok</span>
            </button>
        );
    }

    renderHeader() {
        return (
            <Modal.Header closeButton>
                <Modal.Title>
                    {this.renderTitleContents()}
                </Modal.Title>
            </Modal.Header>
        );
    }

    renderBody() {
        const bodyClassNames = classnames(this.getBodyClassNames());
        return (
            <Modal.Body className={bodyClassNames}>
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
            <Modal dialogClassName={classnames(['modal-dialog-primary', ...this.getModalClassNames()])}
                   bsSize='lg'
                   show={this.props.showModal}
                   onHide={() => {this.onCloseModal();}}
                   backdrop='static'
            >
                {this.renderHeader()}
                {this.renderBody()}
                {this.renderFooter()}
            </Modal>
        );
    }
}

DialogBase.propTypes = {
    showModal: React.PropTypes.bool.isRequired
};
