import React from 'react';
import {Modal} from 'react-bootstrap';
import {connect} from 'react-redux';

import DialogBase from './DialogBase';
import {
    closeOtherSocketsAsync,
    showAnotherPageOpenedModal,
    setWaitStateForModal
} from '../../actions/auth';

class AnotherPageOpenedErrorModal extends DialogBase {
    constructor(props) {
        super(props, 'anotherPageOpenedErrorModal');
    }

    getModalClassNames() {
        return ['modal-sm'];
    }

    renderTitleContents() {
        return (<div>Another Page is Active</div>);
    }

    renderBodyContents() {
        return (<div>Please <a href='#' onClick={() => this.closeOtherSockets()}>click here</a> to use Alapy
            Genomics Explorer in this window. All other opened windows will be logged off/stopped and all
            running processes terminated. Your account supports only one session to be open at a time</div>);
    }

    renderFooterContents() {
        return (
            <div>
                { this.props.isWaitingForClose &&
                <span className="form-padding">Please, wait a moment...</span>
                }
                <button
                    type='button'
                    onClick={() => this.closeOtherSockets()}
                    className='btn btn-default'
                    disabled={this.props.isWaitingForClose}
                >
                    Use Here
                </button>
            </div>
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

    closeOtherSockets() {
        const {dispatch} = this.props;
        dispatch(setWaitStateForModal());
        dispatch(closeOtherSocketsAsync())
            .then(() => dispatch(showAnotherPageOpenedModal(false)));
    }
}

export default connect(() => ({}))(AnotherPageOpenedErrorModal);
