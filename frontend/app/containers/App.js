import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontFaceObserver from 'fontfaceobserver';
import _ from 'lodash';

import config from '../../config';

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact';
import NavbarMain from '../components/Header/NavbarMain';

import AutoLogoutModal from '../components/Modals/AutoLogoutModal';
import ErrorModal from '../components/Modals/ErrorModal';
import FiltersModal from '../components/Modals/FiltersModal';
import FileUploadModal from '../components/Modals/FileUploadModal';
import ViewsModal from '../components/Modals/ViewsModal';
import SavedFilesModal from '../components/Modals/SavedFilesModal';
import AnalysisModal from '../components/Modals/AnalysisModal';
import CloseAllUserSessionsModal from '../components/Modals/CloseAllUserSessionsModal';
import AnotherPageOpenedErrorModal from '../components/Modals/AnotherPageOpenedErrorModal';

import { KeepAliveTask, login, startAutoLogoutTimer, stopAutoLogoutCountdownTimer} from '../actions/auth';
import { openModal, closeModal, modalName } from '../actions/modalWindows';
import { lastErrorResolved } from '../actions/errorHandler';
import {samplesOnSave} from '../actions/samplesList';
import {editAnalysesHistoryItem, resetCurrentAnalysesHistoryIdLoadDataAsync} from '../actions/analysesHistory';
import {applyCurrentLanguageId} from '../actions/ui';
import {closeSavedFilesDialog} from '../actions/savedFiles';
import * as i18n from '../utils/i18n';


class App extends Component {

    componentWillMount() {
        // preload the font, wait for 30 seconds.
        const observer = new FontFaceObserver('Roboto-Medium');
        observer.load(null, 30000);
    }

    componentDidMount() {
        const {dispatch} = this.props;
        const {SESSION: {KEEP_ALIVE_TIMEOUT}} = config;
        dispatch(applyCurrentLanguageId(i18n.DEFAULT_LANGUAGE_ID));
        dispatch(login());

        dispatch(startAutoLogoutTimer());

        const keepAliveTask = new KeepAliveTask(KEEP_ALIVE_TIMEOUT * 1000);
        keepAliveTask.start();
    }

    render() {
        const {
            dispatch,
            samplesList: {hashedArray: {array: samplesArray}},
            modalWindows, savedFiles, showErrorWindow, analysesHistory,
            samplesList, modelsList,
            auth: {
                authType, isDemo, showAutoLogoutDialog, showCloseAllUserSessionsDialog,
                showAnotherPageOpenedModal, isWaitingForCloseAnotherPageOpenedModal
            },
            ui: {languageId}
        } = this.props;
        const {newHistoryItem, currentHistoryId} = analysesHistory;
        const samplesOnSaveParamsReset = {
            action: resetCurrentAnalysesHistoryIdLoadDataAsync,
            propertyIndex: null,
            propertyId: null,
            sampleIds: null
        };
        const samplesOnSaveParamsChange = {
            action: editAnalysesHistoryItem(samplesList, modelsList, isDemo, {sample: {index: null, id: null}}, languageId),
            propertyIndex: 'changeItem.sample.index',
            propertyId: 'changeItem.sample.id',
            sampleIds: newHistoryItem ? _.map(newHistoryItem.samples, sample => sample.id) : null
        };
        const samplesOnSaveParams = currentHistoryId ? samplesOnSaveParamsReset : samplesOnSaveParamsChange;

        return (
            <div className='main subnav-closed' id='main'>
                <nav className='navbar navbar-inverse navbar-static-top'/>
                {<div>&nbsp;</div>}
                {samplesArray.length > 0 &&
                 <div className='container-fluid'>
                    <NavbarMain
                        openAnalysisModal={() => {
                            dispatch(openModal(modalName.ANALYSIS));
                        }}
                        openSamplesModal={() => {
                            dispatch(samplesOnSave(samplesOnSaveParams.sampleIds, null, samplesOnSaveParams.propertyIndex, samplesOnSaveParams.propertyId, samplesOnSaveParams.action));
                            dispatch(openModal(modalName.UPLOAD));
                        }}
                    />
                     <div className='collapse-subnav hidden' id='subnav'>
                     </div>
                     <VariantsTableReact />
                     <div id='fav-message' className='hidden'>
                        You can export these items to file
                     </div>
                 </div>
                }
                <AnalysisModal
                    showModal={modalWindows.analysis.showModal}
                    closeModal={ () => { dispatch(closeModal(modalName.ANALYSIS)); } }
                />
                <ErrorModal
                    showModal={showErrorWindow}
                    closeModal={ () => { dispatch(lastErrorResolved()); } }
                />
                <AutoLogoutModal
                    showModal={showAutoLogoutDialog}
                    closeModal={ () => {
                        dispatch(stopAutoLogoutCountdownTimer());
                        dispatch(startAutoLogoutTimer());
                    } }
                />
                <ViewsModal
                    showModal={modalWindows.views.showModal}
                    closeModal={ () => { dispatch(closeModal(modalName.VIEWS)); } }
                />
                <FiltersModal
                    showModal={modalWindows.filters.showModal}
                    closeModal={ () => { dispatch(closeModal(modalName.FILTERS)); } }
                />
                <FileUploadModal
                    showModal={modalWindows.upload.showModal}
                    closeModal={ () => { dispatch(closeModal(modalName.UPLOAD)); } }
                />
                <SavedFilesModal
                    showModal={savedFiles.showSavedFilesModal}
                    closeModal={ () => { dispatch(closeSavedFilesDialog()); } }
                />
                <CloseAllUserSessionsModal
                    showModal={showCloseAllUserSessionsDialog}
                    authType={authType}
                />
                <AnotherPageOpenedErrorModal
                    showModal={showAnotherPageOpenedModal}
                    isWaitingForClose={isWaitingForCloseAnotherPageOpenedModal}
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    const {
        auth,
        modalWindows,
        savedFiles,
        ui,
        samplesList,
        modelsList,
        analysesHistory,
        errorHandler: { showErrorWindow }
    } = state;

    return {
        auth,
        modalWindows,
        savedFiles,
        ui,
        samplesList,
        modelsList,
        analysesHistory,
        showErrorWindow
    };
}

export default connect(mapStateToProps)(App);
