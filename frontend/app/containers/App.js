import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addTimeout } from 'redux-timeout';
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

import { KeepAliveTask, loginWithGoogle, startAutoLogoutTimer, stopAutoLogoutTimer } from '../actions/auth';
import { openModal, closeModal, modalName } from '../actions/modalWindows';
import { lastErrorResolved } from '../actions/errorHandler';
import {samplesOnSave} from '../actions/samplesList';
import UserActions from '../actions/userActions';
import {editAnalysesHistoryItem} from '../actions/analysesHistory';


class App extends Component {

    componentWillMount() {
        // preload the font, wait for 30 seconds.
        const observer = new FontFaceObserver('Roboto-Medium');
        observer.load(null, 30);
    }

    componentDidMount() {
        const {dispatch} = this.props;
        const {SESSION: {LOGOUT_TIMEOUT, KEEP_ALIVE_TIMEOUT}} = config;
        dispatch(loginWithGoogle());

        const autoLogoutTimeout = LOGOUT_TIMEOUT * 1000;
        const autoLogoutFn = () => { dispatch(startAutoLogoutTimer()); };
        dispatch(addTimeout(autoLogoutTimeout, UserActions, autoLogoutFn));

        const keepAliveTask = new KeepAliveTask(KEEP_ALIVE_TIMEOUT * 1000);
        keepAliveTask.start();
    }

    render() {
        const {dispatch, samplesList: {hashedArray: {array: samplesArray}},
            modalWindows, savedFiles, showErrorWindow, auth, analysesHistory,
            samplesList, modelsList, auth: {isDemo}} = this.props;
        const currentHistoryId = analysesHistory.currentHistoryId;
        const historyList = analysesHistory.history;
        const newHistoryItem = analysesHistory.newHistoryItem;
        const currentHistoryItem =
            currentHistoryId ?
                historyList.find((historyItem) => historyItem.id === currentHistoryId) :
                newHistoryItem;
        const selectedSamplesIds = currentHistoryItem ? _.map(currentHistoryItem.samples, sample => sample.id) : null;
        const action = editAnalysesHistoryItem(samplesList, modelsList, isDemo, {sample: {index: null, id: null}});

        return (
            <div className='main subnav-closed' id='main'>
                <nav className='navbar navbar-inverse navbar-static-top'/>
                {<div>&nbsp;</div>}
                {samplesArray.length > 0 &&
                 <div className='container-fluid'>
                    <NavbarMain
                        openAnalysisModal={() => dispatch(openModal(modalName.ANALYSIS))}
                        openSamplesModal={() => {
                            dispatch(samplesOnSave(selectedSamplesIds, null, 'changeItem.sample.index', 'changeItem.sample.id', action));
                            dispatch(openModal(modalName.UPLOAD));
                        }}
                    />
                     <div className='collapse-subnav hidden' id='subnav'>
                     </div>
                     <VariantsTableReact {...this.props} />
                     <div id='fav-message' className='hidden'>
                        You can export these items to file
                     </div>
                 </div>
                }
                <AnalysisModal
                    showModal={modalWindows.analysis.showModal}
                    closeModal={ () => { dispatch(closeModal(modalName.ANALYSIS)); } }
                    dispatch={dispatch}
                />
                <ErrorModal
                    showModal={showErrorWindow}
                    closeModal={ () => { dispatch(lastErrorResolved()); } }
                />
                <AutoLogoutModal
                    showModal={auth.showAutoLogoutDialog}
                    closeModal={ () => { dispatch(stopAutoLogoutTimer()); } }
                />
                <ViewsModal
                    showModal={modalWindows.views.showModal}
                    closeModal={ (modalName) => { dispatch(closeModal(modalName)); } }
                    dispatch={dispatch}
                />
                <FiltersModal
                    showModal={modalWindows.filters.showModal}
                    closeModal={ (modalName) => { dispatch(closeModal(modalName)); } }
                    dispatch={dispatch}
                />
                <FileUploadModal
                    showModal={modalWindows.upload.showModal}
                    closeModal={ (modalName) => { dispatch(closeModal(modalName)); } }
                />
                <SavedFilesModal
                    showModal={savedFiles.showSavedFilesModal}
                />
                <CloseAllUserSessionsModal
                    showModal={auth.showCloseAllUserSessionsDialog}
                />
                <AnotherPageOpenedErrorModal
                    showModal={auth.showAnotherPageOpenedModal}
                    isWaitingForClose={auth.isWaitingForCloseAnotherPageOpenedModal}
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { auth,
            userData,
            modalWindows,
            fields,
            savedFiles,
            ui,
            samplesList,
            filtersList,
            viewsList,
            modelsList,
            analysesHistory,
            errorHandler: { showErrorWindow } } = state;

    return {
        auth,
        userData,
        modalWindows,
        fields,
        savedFiles,
        ui,
        samplesList,
        filtersList,
        viewsList,
        modelsList,
        analysesHistory,
        showErrorWindow
    };
}

export default connect(mapStateToProps)(App);
