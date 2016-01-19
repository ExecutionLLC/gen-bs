import React, { Component } from 'react';

export default class Auth extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

      <div>
        <div data-toggle="tooltip" data-localize="account.help"  data-placement="left" title="Register or login for access to featured options" data-container="body" data-trigger="hover" className="hidden-xs hidden-xss">
            <a href="#" className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight"><span className="guest" data-localize="account.login.title">Login<span className="hidden-xs"> (<span data-localize="account.register.title">Register</span>)</span></span><span className="user hidden"><span>Name</span><span>Lastname</span></span></a>
        </div>
        <div className="visible-xs visible-xss">
          <a href="#" className="btn navbar-btn dropdown-toggle" data-toggle="collapse" data-target="#sidebarRight"><span className="guest" data-localize="account.login.title">Login</span><span className="user hidden"><span>Name</span><span>Lastname</span></span></a>
        </div> 
      </div> 

    )
  }
}
