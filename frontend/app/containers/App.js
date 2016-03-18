import React, { Component } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact'
import NavbarMain from '../components/Header/NavbarMain'
import NavbarCreateQuery from '../components/Header/NavbarCreateQuery'

import ViewsModal from '../components/Modals/ViewsModal'
import FiltersModal from '../components/Modals/FiltersModal'
import FileUploadModal from '../components/Modals/FileUploadModal'

import { login } from '../actions/auth'
import { openModal, closeModal } from '../actions/modalWindows'
import { fetchUserdata } from '../actions/userData'


class App extends Component {

    componentDidMount() {
        this.props.dispatch(login())
    }

    render() {
        const { isAuthenticated, samples, isFetching } = this.props.userData;
        const { dispatch, ui } = this.props;
        //console.log('query', this.context.router.getCurrentQuery());
        //console.log('query sessionId or Error', location.search.slice(1).split('='));

        var mainDivClass = classNames({
            'main': true,
            'subnav-closed': ui.queryNavbarClosed
        });

        return (

      <div className={mainDivClass} id="main">
        <nav className="navbar navbar-inverse navbar-static-top"></nav>
        {!isAuthenticated &&
          <div >&nbsp;</div>
        }
        {isAuthenticated && isFetching && samples.length === 0 &&
          <div className="loader"><h1>Analyze...</h1></div>
        }
        {isAuthenticated && !isFetching && samples.length === 0 &&
          <h2>Empty.</h2>
        }
        {samples.length > 0 &&
            <div className="container-fluid">



                        <NavbarMain />
                        <div className="collapse collapse-subnav" id="subnav">
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

        </div>
    )
  }
}

function mapStateToProps(state) {
    const { auth, userData, modalWindows, views, fields, ui } = state

    return {
        auth,
        userData,
        modalWindows,
        views,
        fields,
        ui
    }
}

export default connect(mapStateToProps)(App)

