import React, {Component} from 'react';
import { openUserSession} from '../../../actions/auth';

class LoginForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            login: '',
            password: ''
        };
    }

    render() {
        const {login, password} = this.state;
        return (
            <div className='login_form'>
                <input className="form-control"
                    value={login}
                    type='text'
                    key='login'
                    placeholder='Login'
                    onChange={(e) => this.onLoginChanged(e)}/>
                <input  className="form-control"
                    value={password}
                    type='password'
                    key='password'
                    placeholder='Password'
                    onChange={(e) => this.onPasswordChanged(e)}/>
                <button className="btn btn-sm btn-primary login_button"
                    type='button'
                    onClick={(e) => this.onLoginClick(e)}
                >Login</button>
            </div>
        );
    }

    onLoginChanged(e) {
        this.setState(Object.assign({}, this.state,{
            login: e.target.value
        }));
    }

    onPasswordChanged(e) {
        this.setState(Object.assign({}, this.state,{
            password: e.target.value
        }));
    }

    onLoginClick() {
        const {login, password} = this.state;
        const {closeLoginForm} = this.props;

        debugger;
        closeLoginForm();
        this.props.dispatch(openUserSession(this.props.dispatch, login, password));
    }
}

export default LoginForm;
