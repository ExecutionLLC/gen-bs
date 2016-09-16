import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';

import { logout } from '../../../actions/auth';
import config from '../../../../config';

const AUTHORIZED_USER_TITLE = '';
const DEMO_USER_TITLE = 'Register or login for access additional features';
const GOOGLE_ACCOUNT_TITLE = 'Login using Google Account';

class Auth extends Component {
    constructor(...args) {
        super(...args);

        this.state = {
            isDropdownOpened: false
        };
    }
    render() {
        const dropdownClasses = classNames({
            dropdown: true,
            open: this.state.isDropdownOpened
        });
        if (this.props.auth.isDemo) {
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
                            <i className='md-i'>person</i>
                        </span>
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                        <li>
                            <a onClick={ () => { this.props.dispatch(logout()); } }
                               href='#'
                               type='button'
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
        return (
            <div>
                <div className={dropdownClasses}>
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span title={DEMO_USER_TITLE}
                              className='hidden-xs'>
                            Login
                        </span>
                        <span className='visible-xs'>
                            <i className='md-i'>person</i>
                        </span>
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                        <li>
                            <a href={config.LOGIN_URL}>
                                <span title={GOOGLE_ACCOUNT_TITLE}
                                      className='hidden-xs'>
                                    Google Account
                                </span>
                                <span className='visible-xs'>
                                    <i className='md-i'>input</i>
                                </span>
                            </a>
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
