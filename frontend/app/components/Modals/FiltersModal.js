
import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader'
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter'
import FilterBuilder from './FilterBuilder/FilterBuilder'
import ExistentFilterSelect from './FilterBuilder/ExistentFilterSelect'
import NewFilterInputs from './FilterBuilder/NewFilterInputs'

class FiltersModal extends Component {
  render() {

    const { dispatch, showModal, closeModal } = this.props
    const { currentSample, currentFilter } = this.props.ui
    const { samples, views, isValid } = this.props.userData
    const { editOrNew, editedFilter, newFilter} = this.props.filterBuilder

    return (

      
        <Modal
          dialogClassName="modal-dialog-primary"
          bsSize="lg"
          show={this.props.showModal}
          onHide={ () => {this.props.closeModal('filters')} }
        >
            { !isValid &&
              <div >&nbsp;</div>
            }
            { isValid &&
              <div>
                  <FilterBuilderHeader />
                    <form>
                      <Modal.Body>
                          { !editOrNew &&
                            <div>
                              <NewFilterInputs  {...this.props} />
                              <FilterBuilder
                                {...this.props}
                              />
                            </div>
                          }
                          { editOrNew &&
                            <div>
                              <ExistentFilterSelect {...this.props} />
                              <FilterBuilder
                                {...this.props}
                              />
                            </div>
                          }
                      </Modal.Body>
                      <FilterBuilderFooter {...this.props} />
                    </form>
              </div>
            }
        </Modal>

    )
  }
}


function mapStateToProps(state) {
  const { filterBuilder, ui, userData, fields } = state

  return {
    userData,
    fields,
    ui,
    filterBuilder
  }
}

export default connect(mapStateToProps)(FiltersModal)

