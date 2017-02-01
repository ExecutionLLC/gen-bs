import React, {Component} from 'react';

function substArray(template, delimiter, arr) {
    return template
        .split(delimiter)
        .reduce(
            (a, s, i) => {
                return i ?
                    [...a, arr[i - 1], s] :
                    [...a, s]
            },
            []
        );
}

export default class DemoModeMessage extends Component {

    render() {
        const {p} = this.props;
        const loginLink = (
            <a href='#' onClick={() => this.onLoginClick()}>
                <span>{p.t('demoPopup.loginLinkLabel')}</span>
            </a>
        );
        const loginPromptTemplate = p.t('demoPopup.loginPrompt');
        const loginPrompt = substArray(loginPromptTemplate, '__', [loginLink]);

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
