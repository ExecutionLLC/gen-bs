import React  from 'react';
import {connect} from 'react-redux'
import {Modal} from 'react-bootstrap';

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader'
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter'
import NewViewInputs from './ViewBuilder/NewViewInputs'
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect'
import ViewBuilder from './ViewBuilder/ViewBuilder'

class ViewsModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {isValid, showModal, closeModal, viewBuilder} =this.props;
        const editedView = viewBuilder.editedView;
        const isNew = (editedView) ? editedView.id === null : false;
        return (


            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={ () => {closeModal('views')} }
            >
                { !isValid &&
                <div >&nbsp;</div>
                }
                { isValid &&
                <div>
                    <ViewBuilderHeader />
                    <form>
                        <Modal.Body>
                            { isNew &&
                            <div>
                                <NewViewInputs  />
                                <ViewBuilder />
                            </div>
                            }
                            { !isNew &&
                            <div>
                                <ExistentViewSelect />
                                <ViewBuilder />
                            </div>
                            }
                        </Modal.Body>
                        <ViewBuilderFooter closeModal={closeModal}/>
                    </form>
                </div>
                }
            </Modal>

        )
    }
}

function mapStateToProps(state) {
    const {userData, viewBuilder} = state;
    const isValid = userData.isValid;

    return {
        isValid,
        viewBuilder
    }
}

export default connect(mapStateToProps)(ViewsModal)

