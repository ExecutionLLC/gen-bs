import React from 'react';
import {Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import {getP} from 'redux-polyglot/dist/selectors';


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
        const {p} = this.props;
        return <div>{p.t('anotherPageOpened.title')}</div>;
    }

    renderBodyContents() {
        const {p} = this.props;
        return (
            <div>
                {p.t('anotherPageOpened.text.prefix')}
                <a href='#' onClick={() => this.closeOtherSockets()}>{p.t('anotherPageOpened.text.link')}</a>
                {p.t('anotherPageOpened.text.suffix')}
            </div>
        );
    }

    renderFooterContents() {
        const {p} = this.props;
        return (
            <div>
                { this.props.isWaitingForClose &&
                <span className='form-padding'>{p.t('anotherPageOpened.waitCaption')}</span>
                }
                <button
                    type='button'
                    onClick={() => this.closeOtherSockets()}
                    className='btn btn-default'
                    disabled={this.props.isWaitingForClose}
                >
                    {p.t('anotherPageOpened.buttonUseHere')}
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

function mapStateToProps(state) {
    return {
        p: getP(state)
    };
}

export default connect(mapStateToProps)(AnotherPageOpenedErrorModal);
