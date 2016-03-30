import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Modal } from 'react-bootstrap';

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader'
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter'
import NewViewInputs from './ViewBuilder/NewViewInputs'
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect'
import ViewBuilder from './ViewBuilder/ViewBuilder'

class ViewsModal extends Component {


    render() {

        const { views, isValid } = this.props.userData;
        const { editOrNew } = this.props.viewBuilder;

        return (


            <Modal
                dialogClassName="modal-dialog-primary"
                bsSize="lg"
                show={this.props.showModal}
                onHide={ () => {this.props.closeModal('views')} }
            >
                { !isValid &&
                <div >&nbsp;</div>
                }
                { isValid &&
                <div>
                    <ViewBuilderHeader />
                    <form>
                        <Modal.Body>
                            { !editOrNew &&
                            <div>
                                <NewViewInputs  {...this.props} />
                                <ViewBuilder
                                    {...this.props}
                                />
                            </div>
                            }
                            { editOrNew &&
                            <div>
                                <ExistentViewSelect {...this.props} />
                                <ViewBuilder
                                    {...this.props}
                                />
                            </div>
                            }
                        </Modal.Body>
                        <ViewBuilderFooter {...this.props} />
                    </form>
                </div>
                }
            </Modal>

        )
    }
}

function mapStateToProps(state) {
    const { viewBuilder, ui, auth, userData, fields } = state;

    return {
        userData,
        fields,
        ui,
        viewBuilder,
        auth
    }
}

export default connect(mapStateToProps)(ViewsModal)

