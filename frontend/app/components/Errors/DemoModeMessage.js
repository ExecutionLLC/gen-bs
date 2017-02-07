import React, {Component} from 'react';

export default class DemoModeMessage extends Component {

    render() {
        const {p} = this.props;

        return (
            <div className='alert alert-inverse alert-fixed demomode-alert'
                 role='alert'>
                { this.props.errorMessage &&
                <p>{this.props.errorMessage}</p>
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
