import React from 'react';
import {Modal} from 'react-bootstrap';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {viewBuilderCreateView, viewBuilderSelectView, viewBuilderUpdateView} from '../../../actions/viewBuilder'

export default class ViewBuilderFooter extends React.Component {

    render() {
        const {auth, viewBuilder} = this.props;
        const editedView = viewBuilder.editedView;
        var disabledClass = classNames({
            'disabled': (editedView.type === 'advanced' && auth.isDemo) ? 'disabled' : ''
        });
        var title = (editedView.type === 'advanced' && auth.isDemo) ?
            'Login or register to select advanced view' : '';
        const isViewEditable = (editedView.type === 'user');
        const selectButtonLabel = isViewEditable ? 'Save and Select' : 'Select';

        return (

            <Modal.Footer>
                <button
                    onClick={ () => {  this.cancelOnClick()}}
                    type="button"
                    className="btn btn-default"
                    data-dismiss="modal"
                >
                    <span data-localize="actions.cancel"/>Cancel
                </button>

                <button
                    onClick={ (e) => {this.selectOnClick(e)}}
                    type="submit"
                    className="btn btn-primary"
                    disabled={disabledClass}
                    title={title}
                >
                    <span data-localize="actions.save_select.title">{selectButtonLabel}</span>
                </button>
            </Modal.Footer>

        )
    }

    cancelOnClick() {
        const {dispatch, closeModal, views, viewBuilder} =this.props;
        const selectedView = viewBuilder.selectedView;
        closeModal('views');
        dispatch(viewBuilderSelectView(views, selectedView.id, true));
    }

    selectOnClick(e) {
        e.preventDefault();
        const {dispatch, viewBuilder} =this.props;
        const editedView = viewBuilder.editedView;
        editedView.id !== null ? dispatch(viewBuilderUpdateView()) : dispatch(viewBuilderCreateView());
    }
}

function mapStateToProps(state) {
    const {auth, viewBuilder, userData :{views}} = state;
    return {
        views,
        auth,
        viewBuilder
    }
}

export default connect(mapStateToProps)(ViewBuilderFooter);
