import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addTimeout, WATCH_ALL } from 'redux-timeout';
import classNames from 'classnames';

import config from '../../config';

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact';
import NavbarMain from '../components/Header/NavbarMain';
import NavbarCreateQuery from '../components/Header/NavbarCreateQuery';

import AutoLogoutModal from '../components/Modals/AutoLogoutModal';
import ErrorModal from '../components/Modals/ErrorModal';
import FiltersModal from '../components/Modals/FiltersModal';
import FileUploadModal from '../components/Modals/FileUploadModal';
import QueryHistoryModal from '../components/Modals/QueryHistoryModal'
import ViewsModal from '../components/Modals/ViewsModal';
import SavedFilesModal from '../components/Modals/SavedFilesModal';

import { KeepAliveTask, login, startAutoLogoutTimer, stopAutoLogoutTimer } from '../actions/auth';
import { openModal, closeModal } from '../actions/modalWindows';
import { lastErrorResolved } from '../actions/errorHandler';
import { closeQueryHistoryModal } from '../actions/queryHistory'


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
        const { isAuthenticated, isFetching } = this.props.userData;
        const {samplesList: {samples}} = this.props;
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
            <div className={mainDivClass} id="main">
                <nav className="navbar navbar-inverse navbar-static-top"></nav>
                {!isAuthenticated && <div >&nbsp;</div>}
                {isAuthenticated && isFetching && samples.length === 0 &&
                    <div className="loader"><h1>Analyze...</h1></div>
                }
                {isAuthenticated && !isFetching && samples.length === 0 &&
                    <h2>Empty.</h2>
                }
                {samples.length > 0 &&
                 <div className="container-fluid">
                    <NavbarMain />
                     <div className={navbarQueryClass} id="subnav">
                         <NavbarCreateQuery
                          {...this.props}
                          openModal={ (modalName) => { this.props.dispatch(openModal(modalName)) } }
                         />
                     </div>
                     <VariantsTableReact {...this.props} />
                     <div id="fav-message" className="hidden">
                        You can export these items to file
                     </div>
                 </div>
                }
                <ErrorModal
                    showModal={this.props.showErrorWindow}
                    closeModal={ () => { this.props.dispatch(lastErrorResolved()) } }
                />
                <AutoLogoutModal
                    showModal={this.props.auth.showAutoLogoutDialog}
                    closeModal={ () => { this.props.dispatch(stopAutoLogoutTimer()) } }
                />
                <ViewsModal
                    showModal={this.props.modalWindows.views.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)) } }
                />
                <FiltersModal
                    showModal={this.props.modalWindows.filters.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)) } }
                />
                <FileUploadModal
                    showModal={this.props.modalWindows.upload.showModal}
                    closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)) } }
                />
                <SavedFilesModal showModal={this.props.savedFiles.showSavedFilesModal} />
                <QueryHistoryModal
                    showModal={this.props.showQueryHistoryModal}
                    closeModal={ () => { this.props.dispatch(closeQueryHistoryModal()) } }
                />
            </div>
        )
    }
}

function mapStateToProps(state) {
    const { auth,
            userData,
            modalWindows,
            views,
            fields,
            savedFiles,
            ui,
            samplesList,
            errorHandler: { showErrorWindow },
            queryHistory: { showQueryHistoryModal } } = state;

    return {
        auth,
        userData,
        modalWindows,
        views,
        fields,
        savedFiles,
        ui,
        samplesList,
        showErrorWindow,
        showQueryHistoryModal
    }
}

export default connect(mapStateToProps)(App);
