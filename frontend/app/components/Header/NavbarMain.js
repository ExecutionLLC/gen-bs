import React, {Component} from 'react';
import {connect} from 'react-redux';

import {SamplesButton, AnalysisButton} from './NavbarMain/SamplesAnalysisButtons';
import NavbarSearch from './NavbarMain/NavbarSearch';
import ExportDropdown from './NavbarMain/ExportDropdown';
import SavedFiles from './NavbarMain/SavedFiles';
import Auth from './NavbarMain/Auth';

import {changeVariantsGlobalFilter, searchInResultsSortFilter} from '../../actions/variantsTable';

class NavbarMain extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {
            dispatch,
            variantsTable: {selectedRowIndices,searchInResultsParams:{topSearch:{search}}}
        } = this.props;
        const changeGlobalSearchValue = (globalSearchString) => {
            dispatch(changeVariantsGlobalFilter(globalSearchString));
        };
        const sendSearchRequest = (globalSearchString) => {
            dispatch(changeVariantsGlobalFilter(globalSearchString));
            dispatch(searchInResultsSortFilter());
        };
        return (

            <nav className='navbar navbar-inverse navbar-fixed-top navbar-main'>
                <div className='navbar-inner'>

                    <div data-localize='brand.help' data-toggle='tooltip' data-placement='left'
                         title='Click for about and help info' data-container='body' data-trigger='hover'><span
                        className='navbar-text brand' data-toggle='modal' data-target='#info'>
                        <span
                        data-localize='brand.title'>AGx</span>
                        </span>
                    </div>

                    <SamplesButton
                        openSamplesModal={() => this.props.openSamplesModal()}
                    />
                    <AnalysisButton
                        openAnalysisModal={() => this.props.openAnalysisModal()}
                    />
                    <NavbarSearch
                        onGlobalSearchRequested={ (globalSearchString) => { sendSearchRequest(globalSearchString); } }
                        onGlobalSearchStringChanged={ (globalSearchString) => { changeGlobalSearchValue(globalSearchString); } }
                        search={search}
                    />
                    <ExportDropdown dispatch={this.props.dispatch}
                                    selectedRowIndices={selectedRowIndices}
                    />
                    <SavedFiles dispatch={this.props.dispatch}/>
                    <Auth {...this.props} />
                </div>
            </nav>


        );
    }
}

function mapStateToProps(state) {
    const {auth, userData, ui, ws, variantsTable} = state;

    return {
        auth,
        userData,
        ui,
        ws,
        variantsTable
    };
}

export default connect(mapStateToProps)(NavbarMain);

