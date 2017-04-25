import React, { Component, PropTypes } from 'react';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';

import LoginForm from './LoginForm';

import { logout } from '../../../actions/auth';
import config from '../../../../config';

import DemoModeMessage from '../../Errors/DemoModeMessage';

class Auth extends Component {
    constructor(...args) {
        super(...args);
        this.onKeyDownBinded = this.onKeyDownBinded.bind(this);
        this.state = {
            isDropdownOpened: false
        };
    }

    render() {
        const {auth: {isDemo}} = this.props;
        const dropdownClasses = classNames({
            dropdown: true,
            open: this.state.isDropdownOpened
        });
        if (isDemo) {
            return this._renderForDemoUser(dropdownClasses);
        } else {
            return this._renderForAuthorizedUser(dropdownClasses);
        }
    }

    handleClickOutside() {
        this.setState({
            isDropdownOpened: false
        });
    }

    _renderForAuthorizedUser(dropdownClasses) {
        const {userData: {profileMetadata}, p} = this.props;

        return this._renderCommon(
            dropdownClasses,
            p.t('navBar.auth.authorizedUserTitle'),
            profileMetadata.email,
            null,
            () => this._renderForAuthorizedUserList()
        );
    }

    _renderForDemoUser(dropdownClasses) {
        const {auth: {errorMessage}, p} = this.props;

        return this._renderCommon(
            dropdownClasses,
            p.t('navBar.auth.demoUserTitle'),
            p.t('navBar.auth.login'),
            <DemoModeMessage
                errorMessage={errorMessage}
                onLoginClick={() => this.onLoginDropdownClick()}
                p={p}
            />,
            () => this._renderForDemoUserList()
        );
    }

    _renderForAuthorizedUserList() {
        const {p} = this.props;

        return (
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
        );
    }

    _renderForDemoUserList() {
        const {dispatch, p} = this.props;

        return (
            <ul className='dropdown-menu dropdown-menu-right'>
                <li className='dropdown-header'>
                    {p.t('navBar.auth.dropdownHeader')}
                </li>
                <li className='form-inline'>
                    <a href={config.LOGIN_URL} className='btn btn-danger btn-uppercase'>
                        <span title={p.t('navBar.auth.googleAccountTitle')}>
                            {p.t('navBar.auth.googleAccountCaption')}
                        </span>
                    </a>
                </li>
                <li className='dropdown-header'>
                    {p.t('navBar.auth.loginPasswordCaption')}
                </li>
                <li>
                    <LoginForm
                        dispatch={dispatch}
                        closeLoginForm={() => this.handleClickOutside()}
                        p={p}
                    />
                </li>
            </ul>
        );
    }

    _renderCommon(dropdownClasses, title, emailOrLogin, demoModeMessage, renderList) {
        return (
            <div>
                <div className={dropdownClasses}>
                    {demoModeMessage}
                    <a href='#'
                       onClick={() => this.onLoginDropdownClick()}
                       className='btn navbar-btn dropdown-toggle'
                    >
                        <span
                            title={title}
                            className='hidden-xs'
                        >
                            {emailOrLogin}
                        </span>
                        <span className='visible-xs'>
                            <span className='dropdown-menu-header'>
                                {emailOrLogin}
                            </span>
                            <i className='md-i md-person md-replace-to-close' />
                        </span>
                    </a>
                    {renderList()}
                </div>
            </div>
        );
    }

    onLoginDropdownClick() {
        this.setState({
            isDropdownOpened: !this.state.isDropdownOpened
        });
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDownBinded);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDownBinded);
    }

    onKeyDownBinded({keyCode}) {
        if (keyCode === 27) {
            this.onEscape();
        }
    }

    onEscape() {
        this.setState({
            isDropdownOpened: false
        });
    }
}

Auth.propTypes = {
    auth: PropTypes.object.isRequired,
    userData: PropTypes.object.isRequired,
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired
};

export default onClickOutside(Auth);
