import React, { Component } from 'react';
import { connect } from 'react-redux'

import Upload from './NavbarCreateQuery/Upload'
import MetadataSearch from './NavbarCreateQuery/MetadataSearch'
import FiltersSetup from './NavbarCreateQuery/FiltersSetup'
import Filters from './NavbarCreateQuery/Filters'
import ViewsSetup from './NavbarCreateQuery/ViewsSetup'
import Views from './NavbarCreateQuery/Views'
import Analyze from './NavbarCreateQuery/Analyze'
import LoadHistory from './NavbarCreateQuery/LoadHistory'

import { openModal } from '../../actions'


class NavbarCreateQuery extends Component {

  render() {
    return (

        <nav className="navbar navbar-fixed-top navbar-default">
            <div className="container-fluid">
                <div className="table-row">
                  <Upload />
                  <MetadataSearch />
                  <FiltersSetup />
                  <Filters />

                  <ViewsSetup
                    {...this.props}
                  />

                  <Views />
                  <Analyze />
                  <LoadHistory />
                </div>
            </div>
        </nav>

    )
  }
}

function mapStateToProps(state) {
  const { modalWindows } = state

  return {
    modalWindows
  }
}

export default connect(mapStateToProps)(NavbarCreateQuery)

