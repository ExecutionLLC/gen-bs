import React from 'react';
import {connect} from 'react-redux';
import {getP} from 'redux-polyglot/dist/selectors';

import DialogBase from './DialogBase';
import config from '../../../config';
import {closeAllUserSessionsAsync, showCloseAllUserSessionsDialog} from '../../actions/auth';

class CloseAllUserSessionsModal extends DialogBase {
    renderTitleContents() {
        const {p} = this.props;
        return (
            <div>{p.t('closeAllSessions.title')}</div>
        );
    }

    renderFooterContents() {
        const {p} = this.props;
        return (
            <button type='button'
                    onClick={() => this._closeAllSessions()}
                    className='btn btn-default'
            >
                <span>{p.t('closeAllSessions.buttonClose')}</span>
            </button>
        );
    }

    renderBodyContents() {
        const {p} = this.props;
        return (
            <div>{p.t('closeAllSessions.text')}</div>
        );
    }

    onCloseModal() {
        this._closeAllSessions();
    }

    _closeAllSessions() {
        const {dispatch} = this.props;
        dispatch(closeAllUserSessionsAsync())
            .then(() => {
                dispatch(showCloseAllUserSessionsDialog(false));
                window.location = config.LOGIN_URL;
            });
    }
}

function mapStateToProps(state) {
    return {
        p: getP(state)
    };
}

export default connect(mapStateToProps)(CloseAllUserSessionsModal);
