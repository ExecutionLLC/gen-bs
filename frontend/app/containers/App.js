import React, { Component } from 'react';
import { connect } from 'react-redux'

import VariantsTableReact from '../components/VariantsTable/VariantsTableReact'
import NavbarMain from '../components/Header/NavbarMain'
import NavbarCreateQuery from '../components/Header/NavbarCreateQuery'
import ViewsModal from '../components/Modals/ViewsModal'

import { openModal, closeModal } from '../actions/modalWindows'
import { fetchUserdata } from '../actions/userData'


class App extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.dispatch(fetchUserdata())
  }

  render() {
    const { samples, isFetching } = this.props.userData
    return (

      <div className="main" id="main">
        <nav className="navbar navbar-inverse navbar-static-top"></nav>
          <div className="main-frame">

              <div className="main-width-wrapper">
                  <div className="container-fluid" id="maintable">
                      <NavbarMain />
                      <div className="collapse collapse-subnav" id="subnav">
                        {isFetching && samples.length === 0 &&
                          <h2>Loading...</h2>
                        }
                        {!isFetching && samples.length === 0 &&
                          <h2>Empty.</h2>
                        }
                        {samples.length > 0 &&
                          <NavbarCreateQuery
                            {...this.props}
                            openModal={ (modalName) => { this.props.dispatch(openModal(modalName)) } }
                            userData={ this.props.userData  }
                          />
                        }
                      </div>    
                      <VariantsTableReact {...this.props} />
                  </div>

                  <div id="fav-message" className="hidden">
                      You can export these items to file
                  </div>
              </div>

          </div>
          <ViewsModal 
            showModal={this.props.modalWindows.views.showModal}
            closeModal={ (modalName) => { this.props.dispatch(closeModal(modalName)) } }
          />
      </div>

    )
  }
}

function mapStateToProps(state) {
  const { userData, modalWindows } = state

  return {
    userData,
    modalWindows
  }
}

export default connect(mapStateToProps)(App)

