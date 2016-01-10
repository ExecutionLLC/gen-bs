import React, { Component } from 'react';
import CreateQueryNavbarButton from './NavbarMain/CreateQueryNavbarButton'


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
           
            {/* 
              {{> header_nav/create_query}}
             
              {{> header_nav/search}}
            
              {{> header_nav/export_dropdown}}

              {{> header_nav/saved_files}}

              {{> header_nav/language }}
           
              {{> header_nav/auth }}
            */}
            </div>
         </nav>
  

    )
  }
}
