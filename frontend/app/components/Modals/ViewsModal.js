import React  from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader';
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter';
import NewViewInputs from './ViewBuilder/NewViewInputs';
import {viewBuilderEndEdit} from '../../actions/viewBuilder';
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect';
import ViewBuilder from './ViewBuilder/ViewBuilder';

class ViewsModal extends React.Component {

    render() {
        const {auth} = this.props;
        const {views} = this.props.viewsList;
        const {showModal, viewBuilder} = this.props;
        const editingView = viewBuilder.editingView;
        const isNew = editingView ? editingView.id === null : false;
        const isViewEditable = editingView && editingView.type === 'user';
        const isViewAdvanced = editingView && editingView.type === 'advanced';
        const isLoginRequired = isViewAdvanced && auth.isDemo;
        const editedViewNameTrimmed = editingView && editingView.name.trim();

        const viewNameExists = isViewEditable && _(views)
                .filter(view => view.type !== 'history')
                .some(view => view.name.trim() === editedViewNameTrimmed
                    && view.id != editingView.id
                );

        const validationMessage =
            viewNameExists ? 'View with this name is already exists.' :
                editingView && !editedViewNameTrimmed ? 'View name cannot be empty' :
                    '';

        const confirmButtonParams = {
            caption: isViewEditable ? 'Save and Select' : 'Select',
            title: isLoginRequired ? 'Login or register to select advanced view' : '',
            disabled: isLoginRequired || !!validationMessage
        };

        return (


            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
            >
                { !editingView &&
                <div >&nbsp;</div>
                }
                { editingView &&
                <div>
                    <ViewBuilderHeader />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { isNew &&
                                    <div className='modal-padding'>
                                        <NewViewInputs
                                            {...this.props}
                                            validationMessage={validationMessage}
                                        />
                                        <ViewBuilder
                                            {...this.props}
                                        />
                                    </div>   
                                }
                                { !isNew &&
                                    <div className='modal-padding'>
                                        <ExistentViewSelect
                                            {...this.props}
                                        />
                                        <ViewBuilder
                                            {...this.props}
                                        />
                                    </div>
                                }
                            </div>
                        </Modal.Body>
                        <ViewBuilderFooter
                            {...this.props}
                            closeModal={() => this.onClose()}
                            confirmButtonParams={confirmButtonParams}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }

    onClose() {
        this.props.closeModal('views');
        this.props.dispatch(viewBuilderEndEdit());
    }
}

function mapStateToProps(state) {
    const {auth, viewBuilder, userData, fields, viewsList} = state;

    return {
        auth,
        viewBuilder,
        userData,
        fields,
        viewsList
    };
}

export default connect(mapStateToProps)(ViewsModal);

