import React, { Component } from 'react';

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact'
import NavbarMain from '../components/Header/NavbarMain'
import NavbarCreateQuery from '../components/Header/NavbarCreateQuery'


export default class App extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

      <div className="main" id="main">
        <nav className="navbar navbar-inverse navbar-static-top"></nav>
          <div className="main-frame">

              <div className="main-width-wrapper">
                  <div className="container-fluid" id="maintable">
                      <NavbarMain />
                      <div className="collapse collapse-subnav" id="subnav">
                        <NavbarCreateQuery />
                      </div>    
                      <VariantsTableReact {...this.props} />
                  </div>

                  <div id="fav-message" className="hidden">
                      You can export these items to file
                  </div>
              </div>

          </div>
      </div>

    )
  }
}
