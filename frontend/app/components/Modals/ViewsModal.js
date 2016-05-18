import React  from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader';
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter';
import NewViewInputs from './ViewBuilder/NewViewInputs';
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect';
import ViewBuilder from './ViewBuilder/ViewBuilder';

class ViewsModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {auth} = this.props;
        const {showModal, closeModal, viewBuilder} = this.props;
        const editedView = viewBuilder.editedView;
        const isNew = editedView ? editedView.id === null : false;
        const isViewEditable = editedView && editedView.type === 'user';
        const isViewAdvanced = editedView && editedView.type === 'advanced';
        const isLoginRequired = isViewAdvanced && auth.isDemo;
        const editedViewNameTrimmed = editedView && editedView.name.trim();

        const validationMessage = !editedViewNameTrimmed ? 'View name cannot be empty' : '';

        const confirmButton = {
            caption: isViewEditable ? 'Save and Select' : 'Select',
            title: isLoginRequired ? 'Login or register to select advanced view' : '',
            disabled: isLoginRequired || !!validationMessage
        };

        return (


            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={ () => closeModal('views') }
            >
                { !editedView &&
                <div >&nbsp;</div>
                }
                { editedView &&
                <div>
                    <ViewBuilderHeader />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { isNew &&
                                    <div className='modal-padding'>
                                        <NewViewInputs
                                            validationMessage={validationMessage}
                                        />
                                        <ViewBuilder />
                                    </div>   
                                }
                                { !isNew &&
                                    <div className='modal-padding'>
                                        <ExistentViewSelect />
                                        <ViewBuilder />
                                    </div>
                                }
                            </div>
                        </Modal.Body>
                        <ViewBuilderFooter
                            closeModal={closeModal}
                            confirmButton={confirmButton}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }
}

function mapStateToProps(state) {
    const {auth, userData, viewBuilder} = state;

    return {
        auth,
        viewBuilder
    };
}

export default connect(mapStateToProps)(ViewsModal);

