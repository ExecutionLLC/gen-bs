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
import {fetchFields} from '../../actions/fields'

import { changeView, changeFilter, analyze } from '../../actions/ui'
import { changeSample } from '../../actions/samplesList'


class NavbarCreateQuery extends Component {

    onSampleSelected(sampleId) {
        const { dispatch, samples } = this.props;
        dispatch(changeSample(sampleId));
        dispatch(fetchFields(sampleId));
    }

    render() {

        const { dispatch, samples, views } = this.props;
        const { currentSample, currentView, currentFilter } = this.props.ui;
        const currentSampleId = currentSample ? currentSample.id : null;

        return (

            <nav className="navbar navbar-fixed-top navbar-default">
                <div className="container-fluid">
                    <div className="table-row">
                        <Upload  {...this.props} />

                        <MetadataSearch samples={samples}
                                        currentSampleId={currentSampleId}
                                        onSampleChangeRequested={(sampleId) => this.onSampleSelected(sampleId) }
                        />
                        <FiltersSetup {...this.props} />
                        <Filters
                            {...this.props}
                        />

                        <ViewsSetup {...this.props} />
                        <Views
                            {...this.props}
                        />

                        <Analyze
                            {...this.props}
                            clicked={ (e) => dispatch(analyze(currentSample.id, currentView.id, currentFilter.id))}
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
