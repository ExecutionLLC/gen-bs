import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addTimeout, WATCH_ALL } from 'redux-timeout';
import classNames from 'classnames';

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

import { KeepAliveTask, login, startAutoLogoutTimer, stopAutoLogoutTimer } from '../actions/auth';
import { openModal, closeModal } from '../actions/modalWindows';
import { lastErrorResolved } from '../actions/errorHandler';


class App extends Component {

    componentDidMount() {
        const dispatch = this.props.dispatch;
        dispatch(login());

        const autoLogoutTimeout = config.SESSION.LOGOUT_TIMEOUT*1000;
        const autoLogoutFn = () => { dispatch(startAutoLogoutTimer()); };
        dispatch(addTimeout(autoLogoutTimeout, WATCH_ALL, autoLogoutFn));

        const keepAliveTask = new KeepAliveTask(config.SESSION.KEEP_ALIVE_TIMEOUT*1000);
        keepAliveTask.start();
    }

    render() {
        const {samplesList: {hashedArray: {array: samplesArray}}} = this.props;
        const { ui } = this.props;

        const mainDivClass = classNames({
            'main': true,
            'subnav-closed': ui.queryNavbarClosed
        });

        const navbarQueryClass = classNames({
            'collapse-subnav': true,
            'hidden': ui.queryNavbarClosed
        });

        return (
            <div className={mainDivClass} id='main'>
                <nav className='navbar navbar-inverse navbar-static-top'/>
                {<div>&nbsp;</div>}
                {samplesArray.length > 0 &&
                 <div className='container-fluid'>
                    <NavbarMain openAnalysisModal={() => this.props.dispatch(openModal('analysis'))} />
                     <div className={navbarQueryClass} id='subnav'>
                     </div>
                     <VariantsTableReact {...this.props} />
                     <div id='fav-message' className='hidden'>
                        You can export these items to file
                     </div>
                 </div>
                }
                <AnalysisModal
                    showModal={this.props.modalWindows.analysis.showModal}
                    closeModal={ () => { this.props.dispatch(closeModal('analysis')); } }
                    dispatch={this.props.dispatch}
                />
                <ErrorModal
                    showModal={this.props.showErrorWindow}
                    closeModal={ () => { this.props.dispatch(lastErrorResolved()); } }
                />
                <AutoLogoutModal
                    showModal={this.props.auth.showAutoLogoutDialog}
                    closeModal={ () => { this.props.dispatch(stopAutoLogoutTimer()); } }
                />
                <ViewsModal
                    showModal={this.props.modalWindows.views.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)); } }
                    dispatch={this.props.dispatch}
                />
                <FiltersModal
                    showModal={this.props.modalWindows.filters.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)); } }
                    dispatch={this.props.dispatch}
                />
                <FileUploadModal
                    showModal={this.props.modalWindows.upload.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)); } }
                />
                <SavedFilesModal showModal={this.props.savedFiles.showSavedFilesModal} />
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
        showErrorWindow
    };
}

export default connect(mapStateToProps)(App);
