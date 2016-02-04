import React, { Component } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact'
import NavbarMain from '../components/Header/NavbarMain'
import NavbarCreateQuery from '../components/Header/NavbarCreateQuery'

import ViewsModal from '../components/Modals/ViewsModal'
import FiltersModal from '../components/Modals/FiltersModal'

import { login } from '../actions/auth'
import { openModal, closeModal } from '../actions/modalWindows'
import { fetchUserdata } from '../actions/userData'


class App extends Component {

  componentDidMount() {
    this.props.dispatch(login('valarie', 'password'))
  }

  render() {
    const { isAuthenticated, samples, isFetching } = this.props.userData;
    const { dispatch, ui } = this.props;

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
          <div className="loader"></div>
        }
        {isAuthenticated && !isFetching && samples.length === 0 &&
          <h2>Empty.</h2>
        }
        {samples.length > 0 &&
            <div className="main-frame">

                <div className="main-width-wrapper">
                    <div className="container-fluid" id="maintable">
                        <NavbarMain />
                        <div className="collapse collapse-subnav" id="subnav">
                            <NavbarCreateQuery
                              {...this.props}
                              openModal={ (modalName) => { this.props.dispatch(openModal(modalName)) } }
                            />
                        </div>    
                        <VariantsTableReact {...this.props} />
                    </div>

                    <div id="fav-message" className="hidden">
                        You can export these items to file
                    </div>
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

