import React from 'react';
import {Modal} from 'react-bootstrap';

import {viewBuilderSelectView, viewBuilderSaveAndSelectView} from '../../../actions/viewBuilder';

export default class ViewBuilderFooter extends React.Component {

    render() {
        const {confirmButtonParams} = this.props;

        return (
            <Modal.Footer>
                <button
                    onClick={() => this.cancelOnClick()}
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                >
                    <span data-localize='actions.cancel'/>Cancel
                </button>

                <button
                    onClick={(e) => this.selectOnClick(e)}
                    type='submit'
                    className='btn btn-primary'
                    disabled={confirmButtonParams.disabled}
                    title={confirmButtonParams.title}
                >
                    <span data-localize='actions.save_select.title'>{confirmButtonParams.caption}</span>
                </button>
            </Modal.Footer>
        );
    }

    cancelOnClick() {
        const {dispatch, closeModal, userData: {views}, viewBuilder} = this.props;
        const selectedView = viewBuilder.selectedView;
        closeModal();
        dispatch(viewBuilderSelectView(views, selectedView.id)); // TODO remove
    }

    selectOnClick(e) {
        e.preventDefault();
        const {dispatch} = this.props;
        dispatch(viewBuilderSaveAndSelectView());
    }

}
