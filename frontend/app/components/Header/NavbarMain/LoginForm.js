import React, {Component} from 'react';

class LoginForm extends Component {
    render() {
        return (
            <div>
                <input type='text' key='login' />
                <input type='password' key='password' />
                <button type='button'>Login</button>
            </div>
        );
    }
}

export default LoginForm;
