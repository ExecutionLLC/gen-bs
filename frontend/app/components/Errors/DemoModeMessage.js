import React, {Component} from 'react';

function substObject(template, arr) {
    const out = [];
    template
        .replace(
            /(.*?)(?:%{(.*?)}|$)/g,
            (_0, prefix, key) => {
                if(prefix) {
                    out.push(prefix);
                }
                if (key != null) {
                    out.push(arr[key]);
                }
            }
        );
    return out;
}

export default class DemoModeMessage extends Component {

    render() {
        const {p} = this.props;
        const loginLink = (
            <a key={0} href='#' onClick={() => this.onLoginClick()}>
                <span>{p.t('demoPopup.loginLinkLabel')}</span>
            </a>
        );
        const loginPromptTemplate = p.t('demoPopup.loginPrompt');
        const loginPrompt = substObject(loginPromptTemplate, {loginLink});

        return (
            <div className='alert alert-inverse alert-fixed demomode-alert'
                 role='alert'>
                { this.props.errorMessage &&
                <p>{this.props.errorMessage}</p>
                }
                <p>{p.t('demoPopup.caption')}</p>
                <p>{loginPrompt}</p>
            </div>
        );
    }

    onLoginClick() {
        const {onLoginClick} = this.props;
        onLoginClick();
    }
}
