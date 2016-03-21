import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import { viewBuilderUpdateView, viewBuilderCreateView } from '../../../actions/viewBuilder';


export default class ViewBuilderFooter extends Component {

    render() {

        const { dispatch,auth, closeModal } = this.props
        const { editOrNew ,currentView} = this.props.viewBuilder
        var disabledClass = classNames({
            'disabled': (currentView.type === 'advanced' && auth.isDemo) ? 'disabled':''
        })
        var title = (currentView.type === 'advanced' && auth.isDemo) ?
            'Login or register to select advanced view':''


        return (

            <Modal.Footer>
                <button
                    onClick={ () => { this.props.closeModal('views')} }
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
                    <span data-localize="actions.save_select.title">Save and Select</span>
                </button>
            </Modal.Footer>

        )
    }
}
