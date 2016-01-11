import React, { Component } from 'react';

import CreateQueryNavbarButton from './NavbarMain/CreateQueryNavbarButton'
import NavbarSearch from './NavbarMain/NavbarSearch'
import ExportDropdown from './NavbarMain/ExportDropdown'
import SavedFiles from './NavbarMain/SavedFiles'
import Language from './NavbarMain/Language'
import Buy from './NavbarMain/Buy'
import Auth from './NavbarMain/Auth'


export default class NavbarMain extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <nav className="navbar navbar-inverse navbar-fixed-top navbar-main">
          <div className="navbar-inner">

             <div data-localize="brand.help" data-toggle="tooltip" data-placement="left" title="Click for about and help info" data-container="body" data-trigger="hover"><a className="btn navbar-btn brand" data-toggle="modal" data-target="#info"><span data-localize="brand.title">AGx</span><sup>i</sup></a></div>

             <CreateQueryNavbarButton />
             <NavbarSearch />
             <ExportDropdown />
             <SavedFiles />
             <Language />
             <Buy />
             <Auth />
           </div>
         </nav>
  

    )
  }
}
