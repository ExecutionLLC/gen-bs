import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';

import {filterBuilderSaveAndSelectRules} from '../../../actions/filterBuilder';

export default class FilterBuilderFooter extends Component {

    render() {
        const {confirmButton} = this.props;

        return (
            <Modal.Footer>
                <button
                    onClick={() => this.onCancelClick()}
                    type='button'
                    className='btn btn-default'
                    data-dismiss='modal'
                >
                    <span data-localize='actions.cancel'>Cancel</span>
                </button>

                <button
                    onClick={() => this.onConfirmClick()}
                    type='button'
                    className='btn btn-primary'
                    disabled={confirmButton.disabled}
                    title={confirmButton.title}
                >
                    <span data-localize='actions.save_select.title'>{confirmButton.caption}</span>
                </button>
            </Modal.Footer>
        );
    }

    onCancelClick() {
        this.props.closeModal();
    }

    onConfirmClick() {
        const filter = this.props.filterBuilder.editingFilter.filter;
        if (filter.name.trim()) {
            this.props.dispatch(filterBuilderSaveAndSelectRules());
        }
    }

}
