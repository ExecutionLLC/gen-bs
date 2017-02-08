import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import {getP} from 'redux-polyglot/dist/selectors';

import config from '../../../config';
import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader';
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter';
import NewViewInputs from './ViewBuilder/NewViewInputs';
import {viewBuilderEndEdit} from '../../actions/viewBuilder';
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect';
import ViewBuilder from './ViewBuilder/ViewBuilder';
import {entityType, entityTypeIsEditable, entityTypeIsDemoDisabled} from '../../utils/entityTypes';
import {modalName} from '../../actions/modalWindows';
import * as i18n from '../../utils/i18n';

class ViewsModal extends React.Component {

    render() {
        const {auth, showModal, viewBuilder, viewsList, ui, p, dispatch} = this.props;
        const {isDemo} = auth;
        const views = viewsList.hashedArray.array;
        const editingView = viewBuilder.editingView;
        const isNew = editingView ? editingView.id === null : false;
        const isViewEditable = editingView && entityTypeIsEditable(editingView.type);
        const isLoginRequired = editingView && entityTypeIsDemoDisabled(editingView.type, isDemo);
        const editedViewNameTrimmed = editingView && this.getTrimmedViewName(editingView);

        const validationMessage = editingView ? this.getValidationMessage(
            editingView,
            editedViewNameTrimmed,
            isViewEditable,
            views
        ) : '';

        const confirmButtonParams = {
            caption: isViewEditable ? p.t('view.saveAndSelect') : p.t('view.select'),
            title: isLoginRequired ? p.t('view.loginRequiredMsg') : '',
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
                    <ViewBuilderHeader
                        p={p}
                    />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { isNew &&
                                    <div className='modal-padding'>
                                        <NewViewInputs
                                            validationMessage={validationMessage}
                                            viewsList={viewsList}
                                            viewBuilder={viewBuilder}
                                            ui={ui}
                                            dispatch={dispatch}
                                            p={p}
                                        />
                                        <ViewBuilder
                                            {...this.props}
                                        />
                                    </div>   
                                }
                                { !isNew &&
                                    <div className='modal-padding'>
                                        <ExistentViewSelect
                                            auth={auth}
                                            viewsList={viewsList}
                                            viewBuilder={viewBuilder}
                                            ui={ui}
                                            dispatch={dispatch}
                                            p={p}
                                        />
                                        <ViewBuilder
                                            {...this.props}
                                        />
                                    </div>
                                }
                            </div>
                        </Modal.Body>
                        <ViewBuilderFooter
                            closeModal={() => this.onClose()}
                            confirmButtonParams={confirmButtonParams}
                            p={p}
                            dispatch={dispatch}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }

    getTrimmedViewName(view) {
        const {ui: {languageId}} = this.props;
        return i18n.getEntityText(view, languageId).name.trim();
    }

    onClose() {
        const {dispatch, closeModal} = this.props;
        closeModal(modalName.VIEWS); // TODO: closeModal must have no params (it's obvious that we close views)
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
                .some(view => this.getTrimmedViewName(view) === editedViewName
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
    const {auth, viewBuilder, userData, fields, viewsList, ui} = state;

    return {
        auth,
        viewBuilder,
        userData,
        fields,
        viewsList,
        ui,
        p: getP(state)
    };
}

ViewsModal.propTypes = {
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired
};

export default connect(mapStateToProps)(ViewsModal);
