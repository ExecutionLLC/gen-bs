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

        const {isValid} = this.props.userData;
        const {editOrNew} = this.props.filterBuilder;

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

