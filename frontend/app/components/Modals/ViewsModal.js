import React  from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import ViewBuilderHeader from './ViewBuilder/ViewBuilderHeader';
import ViewBuilderFooter from './ViewBuilder/ViewBuilderFooter';
import NewViewInputs from './ViewBuilder/NewViewInputs';
import ExistentViewSelect from './ViewBuilder/ExistentViewSelect';
import ViewBuilder from './ViewBuilder/ViewBuilder';
import classNames from 'classnames';

class ViewsModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {isValid, showModal, closeModal, viewBuilder} = this.props;
        const editedView = viewBuilder.editedView;
        const isNew = (editedView) ? editedView.id === null : false;

        const confirmButton = (() => {
            const {auth, viewBuilder} = this.props;
            const editedView = viewBuilder.editedView;
            if (!editedView) {
                return {};
            }
            var disabledClass = classNames({
                'disabled': (editedView.type === 'advanced' && auth.isDemo || !editedView.name.trim()) ? 'disabled' : ''
            });
            var title = (editedView.type === 'advanced' && auth.isDemo) ?
                'Login or register to select advanced view' : '';
            const isViewEditable = (editedView.type === 'user');
            const selectButtonLabel = isViewEditable ? 'Save and Select' : 'Select';
            return {
                caption: selectButtonLabel,
                title: title,
                disabled: disabledClass
            };
        })();
        return (


            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={ () => closeModal('views') }
            >
                { !isValid &&
                <div >&nbsp;</div>
                }
                { isValid &&
                <div>
                    <ViewBuilderHeader />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { isNew &&
                                    <div className='modal-padding'>
                                        <NewViewInputs  />
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
    const isValid = userData.isValid;

    return {
        isValid,
        auth,
        viewBuilder
    };
}

export default connect(mapStateToProps)(ViewsModal);

