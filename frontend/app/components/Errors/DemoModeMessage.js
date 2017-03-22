import React, {Component, PropTypes} from 'react';

export default class DemoModeMessage extends Component {

    render() {
        const {p, errorMessage} = this.props;

        return (
            <div className='alert alert-inverse alert-fixed demomode-alert'
                 role='alert'>
                { errorMessage &&
                <p>{errorMessage}</p>
                }
                <p>{p.t('demoPopup.caption')}</p>
                <p>
                    {p.t('demoPopup.loginLinkPrefix')}
                    <a href='#' onClick={() => this.onLoginClick()}>
                        <span>{p.t('demoPopup.loginLinkLabel')}</span>
                    </a>
                    {p.t('demoPopup.loginLinkSuffix')}
                </p>
            </div>
        );
    }

    onLoginClick() {
        const {onLoginClick} = this.props;
        onLoginClick();
    }
}

DemoModeMessage.propTypes = {
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired,
    errorMessage: PropTypes.string,
    onLoginClick: PropTypes.func.isRequired
};
