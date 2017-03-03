import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';

import LoginForm from './LoginForm';

import { logout } from '../../../actions/auth';
import config from '../../../../config';

import DemoModeMessage from '../../Errors/DemoModeMessage';

class Auth extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            isDropdownOpened: false
        };
    }

    render() {
        const {auth: {isDemo}} = this.props;
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
        const {userData: {profileMetadata}, p} = this.props;
        return (
            <div>
                <div className={dropdownClasses}>
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span
                            title={p.t('navBar.auth.authorizedUserTitle')}
                            className='hidden-xs'
                        >
                            { profileMetadata.email }
                        </span>
                        <span className='visible-xs'>
                            <span className='dropdown-menu-header'>{ profileMetadata.email }</span>
                            <i className='md-i md-person md-replace-to-close'></i>
                        </span>
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                        <li className='form-inline'>
                            <a
                                onClick={ () => { this.props.dispatch(logout()); } }
                                href='#'
                                type='button'
                                className='btn btn-primary btn-uppercase'
                                id='logout'
                            >
                                <span>{p.t('navBar.auth.logout')}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    _renderForDemoUser(dropdownClasses) {
        const {dispatch, auth: {errorMessage}, p} = this.props;
        return (
            <div>

                <div className={dropdownClasses}>
                    <DemoModeMessage
                        errorMessage={errorMessage}
                        dispatch={dispatch}
                        onLoginClick={() => this.onLoginDropdownClick()}
                        p={p}
                    />
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span
                            title={p.t('navBar.auth.demoUserTitle')}
                            className='hidden-xs'
                        >
                            {p.t('navBar.auth.login')}
                        </span>
                        <span className='visible-xs'>
                          <span className='dropdown-menu-header'>{p.t('navBar.auth.login')}</span>
                          <i className='md-i md-person md-replace-to-close'></i>
                        </span>                          
                    </a>
                    <ul className='dropdown-menu dropdown-menu-right'>
                        <li className='dropdown-header'>{p.t('navBar.auth.dropdownHeader')}</li>
                        <li className='form-inline'>
                            <a href={config.LOGIN_URL} className='btn btn-danger btn-uppercase'>
                                <span title={p.t('navBar.auth.googleAccountTitle')}>
                                    {p.t('navBar.auth.googleAccountCaption')}
                                </span>
                            </a>
                        </li>
                        <li className='dropdown-header'>{p.t('navBar.auth.loginPasswordCaption')}</li>
                        <li>
                            <LoginForm
                                dispatch={dispatch}
                                closeLoginForm={() => this.handleClickOutside()}
                                p={p}
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
