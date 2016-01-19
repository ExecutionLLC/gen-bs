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

import { changeSample, changeView, analyze } from '../../actions/ui'


class NavbarCreateQuery extends Component {

  render() {

    const { dispatch, samples, views } = this.props
    const { currentSample, currentView } = this.props.ui


    return (

        <nav className="navbar navbar-fixed-top navbar-default">
            <div className="container-fluid">
                <div className="table-row">
                  <Upload />
                  <MetadataSearch
                    {...this.props}
                    sampleSelected={ (e) => dispatch(changeSample(samples, $(e.target).val()))}
                  />
                  <FiltersSetup {...this.props} />
                  <Filters
                    {...this.props}
                    filterSelected={ (e) => dispatch(changeFilter(views, $(e.target).val()))}
                  />

                  <ViewsSetup {...this.props} />
                  <Views
                    {...this.props}
                  />

                  <Analyze 
                    {...this.props}
                    clicked ={ (e) => dispatch(analyze(currentSample.id, currentView.id, null))}
                  />
                  <LoadHistory />
                </div>
            </div>
        </nav>

    )
  }
}

function mapStateToProps(state) {
  const { modalWindows, userData, ui} = state

  return {
    modalWindows,
    samples: userData.samples,
    views: userData.views,
    filters: userData.filters,
    ui
  }
}

export default connect(mapStateToProps)(NavbarCreateQuery)

