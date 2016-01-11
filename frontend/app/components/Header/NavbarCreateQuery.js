import React, { Component } from 'react';

import Upload from './NavbarCreateQuery/Upload'
import MetadataSearch from './NavbarCreateQuery/MetadataSearch'
import FiltersSetup from './NavbarCreateQuery/FiltersSetup'
import Filters from './NavbarCreateQuery/Filters'
import ViewsSetup from './NavbarCreateQuery/ViewsSetup'
import Views from './NavbarCreateQuery/Views'
import Analyze from './NavbarCreateQuery/Analyze'
import LoadHistory from './NavbarCreateQuery/LoadHistory'


export default class NavbarMain extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <nav className="navbar navbar-fixed-top navbar-default">
            <div className="container-fluid">
                <div className="table-row">
                  <Upload />
                  <MetadataSearch />
                  <FiltersSetup />
                  <Filters />
                  <ViewsSetup />
                  <Views />
                  <Analyze />
                  <LoadHistory />

                    
                  {/* 
                   
                        {{> create_query/load_history }}
                        */}
                   

                </div>
            </div>
        </nav>

    )
  }
}
