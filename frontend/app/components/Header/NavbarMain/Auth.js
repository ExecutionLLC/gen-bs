import React, { Component } from 'react';

import { logout } from '../../../actions/auth';
import config from '../../../../config';

const AUTHORIZED_USER_TITLE = '';
const DEMO_USER_TITLE = 'Register or login for access to featured options';

export default class Auth extends Component {
    _renderForAuthorizedUser() {
        return (
            <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title={AUTHORIZED_USER_TITLE} data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
                <div className="dropdown">
                    <a href="#" className="btn navbar-btn dropdown-toggle" data-toggle="dropdown" data-target="#sidebarRight">
                        <span className="guest" data-localize="account.login.title">
                            { this.props.userData.profileMetadata.email }
                        </span>
                    </a>
                    <ul className="dropdown-menu">
                        <li>
                            <a onClick={ e => { this.props.dispatch(logout()) } } href="#" type="button" id="logout">
                                <span data-localize="account.logout">Logout</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }

    _renderForDemoUser() {
        return (
            <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title={DEMO_USER_TITLE} data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
                <a href={config.LOGIN_URL} className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight">
                    <span className="guest" data-localize="account.login.title">
                        Login
                        <span className="hidden-xs"></span>
                    </span>
                    <span className="user hidden">
                        <span>Name</span>
                        <span>Lastname</span>
                    </span>
                </a>
            </div>
        )
    }

    render() {
        console.log('auth header', this.props.auth.isDemo);
        if (this.props.auth.isDemo) {
            return this._renderForDemoUser();
        }
        return this._renderForAuthorizedUser();
    }
}
