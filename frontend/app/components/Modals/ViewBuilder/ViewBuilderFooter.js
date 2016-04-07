import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { viewBuilderUpdateView, viewBuilderCreateView } from '../../../actions/viewBuilder';


export default class ViewBuilderFooter extends Component {

    render() {

        const { dispatch,auth, closeModal } = this.props;
        const { editOrNew ,editedView, newView} = this.props.viewBuilder;
        const view = editOrNew ? (editedView) : (newView);
        var disabledClass = classNames({
            'disabled': (view.type === 'advanced' && auth.isDemo) ? 'disabled':''
        })
        var title = (view.type === 'advanced' && auth.isDemo) ?
            'Login or register to select advanced view':'';
        const isViewEditable = (view.type === 'user');
        const selectButtonLabel = isViewEditable ? 'Save and Select': 'Select';

        return (

            <Modal.Footer>
                <button
                    onClick={ () => { closeModal('views')} }
                    type="button"
                    className="btn btn-default"
                    data-dismiss="modal"
                >
                    <span data-localize="actions.cancel"/>Cancel
                </button>

                <button
                    onClick={ () => {
              editOrNew ? dispatch(viewBuilderUpdateView()) : dispatch(viewBuilderCreateView())
            }}
                    type="button"
                    className="btn btn-primary"
                    disabled={disabledClass}
                    title={title}
                >
                    <span data-localize="actions.save_select.title">{selectButtonLabel}</span>
                </button>
            </Modal.Footer>

        )
    }
}
