import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader'
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter'
import FilterBuilder from './FilterBuilder/FilterBuilder'
import {filterBuilderEndEdit} from '../../actions/filterBuilder';
import ExistentFilterSelect from './FilterBuilder/ExistentFilterSelect'
import NewFilterInputs from './FilterBuilder/NewFilterInputs'

class FiltersModal extends Component {
    render() {

        const {isValid} = this.props.userData;
        const {editingFilter} = this.props.filterBuilder;
        const editingFilterIsNew = editingFilter ? editingFilter.isNew : false;
        return (

            <Modal
                dialogClassName="modal-dialog-primary"
                bsSize="lg"
                show={this.props.showModal}
                onHide={ () => {this.props.closeModal('filters'); this.props.dispatch(filterBuilderEndEdit()); } }
            >
                { (!isValid || !editingFilter) &&
                <div >&nbsp;</div>
                }
                { (isValid && editingFilter) &&
                <div>
                    <FilterBuilderHeader />
                    <form>
                        <Modal.Body>
                            <div className="modal-body-scroll">
                                { editingFilterIsNew &&
                                <div className="modal-padding">
                                    <NewFilterInputs  {...this.props} />
                                    <FilterBuilder
                                        {...this.props}
                                    />
                                </div>
                                }
                                { !editingFilterIsNew &&
                                <div className="modal-padding">
                                    <ExistentFilterSelect {...this.props} />
                                    <FilterBuilder
                                        {...this.props}
                                    />
                                </div>
                                }
                            </div>
                        </Modal.Body>
                        <FilterBuilderFooter
                            {...this.props}
                            closeModal={() => { this.props.closeModal('filters'); this.props.dispatch(filterBuilderEndEdit()); } }
                        />
                    </form>
                </div>
                }
            </Modal>

        )
    }
}


function mapStateToProps(state) {
    const { filterBuilder, ui, auth, userData, fields, samplesList } = state

    return {
        userData,
        fields,
        ui,
        filterBuilder,
        auth,
        samplesList
    }
}

export default connect(mapStateToProps)(FiltersModal)

