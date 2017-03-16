import React, {Component, PropTypes} from 'react';
import {openUserSession} from '../../../actions/auth';

export default class LoginForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            login: '',
            password: ''
        };
    }

    render() {
        const {p} = this.props;
        const {login, password} = this.state;
        const isDisabled = !(login && password);
        return (
            <form
                className='form-inline'
                onSubmit={(e) => {
                    e.preventDefault();
                    this.onLoginClick();
                }}
            >
                <input className='form-control material-input-sm'
                       value={login}
                       type='text'
                       key='login'
                       placeholder={p.t('navBar.auth.loginPlaceholder')}
                       name='username'
                       onChange={(e) => this.onLoginChanged(e)}/>
                <input className='form-control material-input-sm'
                       value={password}
                       type='password'
                       key='password'
                       name='password'
                       placeholder={p.t('navBar.auth.passwordPlaceholder')}
                       onChange={(e) => this.onPasswordChanged(e)}/>
                <button className='btn btn-primary  btn-uppercase login-button'
                        type='submit'
                        disabled={isDisabled}
                >
                    {p.t('navBar.auth.login')}
                </button>
            </form>
        );
    }

    onLoginChanged(e) {
        this.setState({login: e.target.value});
    }

    onPasswordChanged(e) {
        this.setState({password: e.target.value});
    }

    onLoginClick() {
        const {login, password} = this.state;
        const {closeLoginForm, dispatch} = this.props;

        closeLoginForm();
        dispatch(openUserSession(login, password));
    }
}

LoginForm.propTypes = {
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired,
    closeLoginForm: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired
};
