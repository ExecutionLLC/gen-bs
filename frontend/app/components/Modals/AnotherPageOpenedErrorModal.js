import React from 'react';
import {connect} from 'react-redux';

import DialogBase from './DialogBase';
import {closeOtherSocketsAsync, showAnotherPageOpenedModal} from '../../actions/auth';

class AnotherPageOpenedErrorModal extends DialogBase {
    constructor(props) {
        super(props, 'anotherPageOpenedErrorModal');
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
            <button
                type='button'
                onClick={() => this.closeOtherSockets()}
                className='btn btn-default'
            >
                <span>Use Here</span>
            </button>
        );
    }

    closeOtherSockets() {
        const {dispatch} = this.props;
        dispatch(closeOtherSocketsAsync())
            .then(() => dispatch(showAnotherPageOpenedModal(false)));
    }
}

export default connect(() => ({}))(AnotherPageOpenedErrorModal);
