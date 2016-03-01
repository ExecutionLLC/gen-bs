import React, { Component } from 'react';

export default class Auth extends Component {

  render() {
    console.log('auth header', this.props.auth.isDemo)
    return (

      <div>
        { !this.props.auth.isDemo &&
            <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title="Register or login for access to featured options" data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
              <a href="#" className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight">
                <span className="guest" data-localize="account.login.title">
                  {this.props.userData.profileMetadata.email}
                </span>
              </a>
            </div>
        }
        { this.props.auth.isDemo &&
          <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title="Register or login for access to featured options" data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
            <a href={`http://${API_HOST}:${API_PORT}/api/session/auth/google?callbackPort=8080`} className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight"><span className="guest" data-localize="account.login.title">Login<span className="hidden-xs"> (<span data-localize="account.register.title">Register</span>)</span></span><span className="user hidden"><span>Name</span><span>Lastname</span></span></a>
          </div>
        }
      </div>

    )
  }
}
