import React, { Component } from 'react';

import { logout } from '../../../actions/auth'

export default class Auth extends Component {

  render() {
    console.log('auth header', this.props.auth.isDemo)
    return (

      <div>
        { !this.props.auth.isDemo &&
            <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title="Register or login for access to featured options" data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
              <div className="dropdown">
                <a href="#" className="btn navbar-btn dropdown-toggle" data-toggle="dropdown" data-target="#sidebarRight">
                  <span className="guest" data-localize="account.login.title">
                    {this.props.userData.profileMetadata.email}
                  </span>
                </a>
                  <ul className="dropdown-menu">
                    <li><a onClick={ e => { this.props.dispatch(logout()) } } href="#" type="button" id="logout"><span data-localize="account.logout">Logout</span></a></li>

                  </ul>
              </div>
            </div>
        }
        { this.props.auth.isDemo &&
          <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title="Register or login for access to featured options" data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
            <a href={`http://${API_HOST}:${API_PORT}/api/session/auth/google?callbackPort=8080`} className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight"><span className="guest" data-localize="account.login.title">Login<span className="hidden-xs"></span></span><span className="user hidden"><span>Name</span><span>Lastname</span></span></a>
          </div>
        }
      </div>

    )
  }
}
