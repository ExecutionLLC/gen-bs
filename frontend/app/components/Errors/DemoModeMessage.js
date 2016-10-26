import React, {Component} from 'react';

export default class DemoModeMessage extends Component {

    render() {
        return (
            <div className='alert alert-inverse alert-fixed demomode-alert'
                 role='alert'>
                { this.props.errorMessage &&
                <p>{this.props.errorMessage}</p>
                }
                <p>Demo Mode</p>
                <p>Please <a href='#' onClick={() => this.onLoginClick()}><span>login</span></a></p>
            </div>
        );
    }

    onLoginClick() {
        const {onLoginClick} = this.props;
        onLoginClick();
    }
}
