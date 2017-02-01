import _ from 'lodash';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {SamplesButton, AnalysisButton} from './NavbarMain/SamplesAnalysisButtons';
import NavbarSearch from './NavbarMain/NavbarSearch';
import ExportDropdown from './NavbarMain/ExportDropdown';
import SavedFiles from './NavbarMain/SavedFiles';
import Auth from './NavbarMain/Auth';

import {changeVariantsGlobalFilter, searchInResultsSortFilter} from '../../actions/variantsTable';
import {fileUploadStatus, SAMPLE_UPLOAD_STATE} from '../../actions/fileUpload';
import {entityType} from '../../utils/entityTypes';
import * as PropTypes from 'react/lib/ReactPropTypes';
import {getP} from 'redux-polyglot/dist/selectors';


class NavbarMain extends Component {

    render() {
        const {
            dispatch,
            variantsTable: {selectedRowIndices, searchInResultsParams: {topSearch: {search}}},
            samplesList,
            fileUpload: {filesProcesses}
        } = this.props;
        const changeGlobalSearchValue = (globalSearchString) => {
            dispatch(changeVariantsGlobalFilter(globalSearchString));
        };
        const sendSearchRequest = (globalSearchString) => {
            dispatch(changeVariantsGlobalFilter(globalSearchString));
            dispatch(searchInResultsSortFilter());
        };

        // count the same way as they displaying in FileUploadLeftPane
        const uploadHash = _.keyBy(filesProcesses, 'operationId');
        const uploadedSamples = _.filter(samplesList.hashedArray.array, sample => !_.isEmpty(sample.sampleFields));
        const samplesData = _.map(uploadedSamples, sample => {
            const {vcfFileId} = sample;
            const currentUpload = uploadHash[vcfFileId];
            return {
                upload: currentUpload,
                sample: sample
            };
        });
        const newSamplesCount = samplesData.reduce(
            (count, uploadData) => {
                const {upload, sample} = uploadData;
                if (sample &&
                    upload &&
                    sample.type !== entityType.HISTORY &&
                    _.includes([fileUploadStatus.ERROR, fileUploadStatus.READY], upload.progressStatus) &&
                    sample.uploadState === SAMPLE_UPLOAD_STATE.COMPLETED) {
                    return count + 1;
                } else {
                    return count;
                }
            },
            0
        );

        return (

            <nav className='navbar navbar-inverse navbar-fixed-top navbar-main'>
                <div className='navbar-inner'>
                    <div className='dropdown'>
                        <a role='button' className='btn navbar-btn brand dropdown-toggle'>
                            {this.props.p.t('common.agx')}
                        </a>
                    </div>
                    <SamplesButton
                        openSamplesModal={() => this.props.openSamplesModal()}
                        badge={newSamplesCount || null}
                    />
                    <AnalysisButton
                        openAnalysisModal={() => this.props.openAnalysisModal()}
                    />
                    <NavbarSearch
                        onGlobalSearchRequested={ (globalSearchString) => { sendSearchRequest(globalSearchString); } }
                        onGlobalSearchStringChanged={ (globalSearchString) => { changeGlobalSearchValue(globalSearchString); } }
                        search={search}
                        p={this.props.p}
                    />
                    <ExportDropdown dispatch={this.props.dispatch}
                                    selectedRowIndices={selectedRowIndices}
                                    p={this.props.p}
                    />
                    <SavedFiles dispatch={this.props.dispatch}/>
                    <Auth {...this.props} />
                </div>
            </nav>


        );
    }
}

function mapStateToProps(state) {
    const {auth, userData, ws, variantsTable, samplesList, fileUpload} = state;

    return {
        auth,
        userData,
        ws,
        variantsTable,
        samplesList,
        fileUpload,
        p: getP(state)
    };
}

NavbarMain.propTypes = {
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired
};

export default connect(mapStateToProps)(NavbarMain);

