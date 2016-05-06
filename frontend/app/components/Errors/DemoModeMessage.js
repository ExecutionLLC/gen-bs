import React, {Component} from 'react';

export default class DemoModeMessage extends Component {

    render() {
        return (
            <div className='alert alert-inverse alert-fixed' role='alert'>
                { this.props.errorMessage &&
                <p>{this.props.errorMessage}</p>
                }
                <p>Demo Mode</p>
                <p>Please, login</p>
            </div>
        );
    }
}
