import React  from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import config from '../../../config';
import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader';
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter';
import NewViewInputs from './ViewBuilder/NewViewInputs';
import {viewBuilderEndEdit} from '../../actions/viewBuilder';
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect';
import ViewBuilder from './ViewBuilder/ViewBuilder';
import {entityType, entityTypeIsEditable, entityTypeIsDemoDisabled} from '../../utils/entityTypes';

class ViewsModal extends React.Component {

    render() {
        const {auth: {isDemo}, showModal, viewBuilder, viewsList} = this.props;
        const views = viewsList.hashedArray.array;
        const editingView = viewBuilder.editingView;
        const isNew = editingView ? editingView.id === null : false;
        const isViewEditable = editingView && entityTypeIsEditable(editingView.type);
        const isLoginRequired = editingView && entityTypeIsDemoDisabled(editingView.type, isDemo);
        const editedViewNameTrimmed = editingView && editingView.name.trim();

        const validationMessage = editingView ? this.getValidationMessage(
            editingView,
            editedViewNameTrimmed,
            isViewEditable,
            views
        ) : '';

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
                backdrop='static'
            >
                { !editingView &&
                <div>&nbsp;</div>
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
        const {dispatch, closeModal} = this.props;
        closeModal('views');
        dispatch(viewBuilderEndEdit());
    }

    /**
     * @param {Object}editingView
     * @param {string}editedViewName
     * @param {boolean}isViewEditable
     * @param {Array<Object>}views
     * @return {string}
     */
    getValidationMessage(editingView, editedViewName, isViewEditable, views) {
        const viewNameExists = isViewEditable && _(views)
                .filter(view => view.type !== entityType.HISTORY)
                .some(view => view.name.trim() === editedViewName
                    && view.id != editingView.id
                );
        if (viewNameExists) {
            return 'View with this name is already exists.';
        }

        if (!editedViewName) {
            return 'Name cannot be empty';
        }

        if (editedViewName && editedViewName.length > config.VIEWS.MAX_NAME_LENGTH) {
            return `Name length should be less than ${config.VIEWS.MAX_NAME_LENGTH}.`;
        }

        return '';
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

