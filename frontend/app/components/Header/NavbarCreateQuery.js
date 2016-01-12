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

import { changeView } from '../../actions/views'


class NavbarCreateQuery extends Component {


  render() {
    console.log('props onSelect', this.props);
    return (

        <nav className="navbar navbar-fixed-top navbar-default">
            <div className="container-fluid">
                <div className="table-row">
                  <Upload />
                  <MetadataSearch />
                  <FiltersSetup />
                  <Filters />

                  <ViewsSetup {...this.props} />
                  <Views
                    {...this.props}
                    viewSelected={ (e) => this.props.dispatch(changeView(this.props.views.list, $(e.target).val()))}
                  />

                  <Analyze />
                  <LoadHistory />
                </div>
            </div>
        </nav>

    )
  }
}

function mapStateToProps(state) {
  const { modalWindows, views } = state

  return {
    modalWindows,
    views
  }
}

export default connect(mapStateToProps)(NavbarCreateQuery)

