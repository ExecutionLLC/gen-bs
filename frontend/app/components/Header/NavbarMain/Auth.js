import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';

import LoginForm from './LoginForm';

import { logout } from '../../../actions/auth';
import config from '../../../../config';

const AUTHORIZED_USER_TITLE = '';
const DEMO_USER_TITLE = 'Register or login for access additional features';
const GOOGLE_ACCOUNT_TITLE = 'Login using Google Account';
import DemoModeMessage from '../../Errors/DemoModeMessage';

class Auth extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            isDropdownOpened: false
        };
    }

    render() {
        const {auth:{isDemo}} = this.props;
        // TODO: Close form on Esc
        const dropdownClasses = classNames({
            dropdown: true,
            open: this.state.isDropdownOpened
        });
        if (isDemo) {
            return this._renderForDemoUser(dropdownClasses);
        }
        return this._renderForAuthorizedUser(dropdownClasses);
    }

    handleClickOutside() {
        this.setState({
            isDropdownOpened: false
        });
    }

    _renderForAuthorizedUser(dropdownClasses) {
        const {profileMetadata} = this.props.userData;
        return (
            <div>
                <div className={dropdownClasses}>
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span title={AUTHORIZED_USER_TITLE}
                              className='hidden-xs'>
                            { profileMetadata.email }
                        </span>
                        <span className='visible-xs'>
                            <span className='dropdown-menu-header'>{ profileMetadata.email }</span>
                            <i className='md-i md-person md-replace-to-close'></i>
                        </span>
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                        <li className='form-inline'>
                            <a onClick={ () => { this.props.dispatch(logout()); } }
                               href='#'
                               type='button'
                               className='btn btn-primary btn-uppercase'
                               id='logout'>
                                <span>Logout</span>
                            </a>
                        </li>
                                
                      </ul>
                </div>
            </div>
        );
    }

    _renderForDemoUser(dropdownClasses) {
        const {dispatch, auth:{isDemo, errorMessage}} = this.props;
        return (
            <div>

                <div className={dropdownClasses}>
                    { isDemo &&
                    <DemoModeMessage
                        errorMessage={errorMessage}
                        dispatch={dispatch}
                        onLoginClick={() => this.onLoginDropdownClick()}
                    />
                    }
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span title={DEMO_USER_TITLE}
                              className='hidden-xs'>
                            Login
                        </span>
                        <span className='visible-xs'>
                          <span className='dropdown-menu-header'>Login</span>
                          <i className='md-i md-person md-replace-to-close'></i>
                        </span>                          
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                       <li className='dropdown-header'>Login with</li>
                        <li className='form-inline'>
                            <a href={config.LOGIN_URL} className='btn btn-danger btn-uppercase'>
                                <span title={GOOGLE_ACCOUNT_TITLE}>
                                    Google Account
                                </span>
                            </a>
                        </li>
                        <li className='dropdown-header'>OR login</li>
                        <li>
                            <LoginForm
                                dispatch={this.props.dispatch}
                                closeLoginForm={() => this.handleClickOutside()}
                            />
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    onLoginDropdownClick() {
        this.setState({
            isDropdownOpened: !this.state.isDropdownOpened
        });
    }
}

export default onClickOutside(Auth);
