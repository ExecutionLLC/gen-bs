import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames';

import {filterBuilderSaveAndSelectRules} from '../../../actions/filterBuilder';


export default class FilterBuilderFooter extends Component {

    onCancelClick() {
        this.props.closeModal();
    }

    onConfirmClick() {
        const filter = this.props.filterBuilder.editingFilter.filter;
        if (filter.name.trim()) {
            this.props.dispatch(filterBuilderSaveAndSelectRules());
        }
    }

    render() {
        const {auth, confirmButton} = this.props;
        const {filters} = this.props.filtersList;
        const editingFilter = this.props.filterBuilder.editingFilter.filter;

        const isFilterEditable = editingFilter.type === 'user';
        const filterNameExists = isFilterEditable && _(filters)
            .filter(filter => filter.type === 'user')
            .some(filter => filter.name.trim() == editingFilter.name.trim()
                && filter.id != editingFilter.id
            );
        const disabledClass = classNames({
            'disabled': (editingFilter.type === 'advanced' && auth.isDemo || !editingFilter.name.trim() || filterNameExists) ? 'disabled' : ''
        });
        const title = (editingFilter.type === 'advanced' && auth.isDemo) ? 'Login or register to select advanced filters' : '';
        const selectButtonLabel = isFilterEditable ? 'Save and Select': 'Select';

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
                    disabled={confirmButton.disabled}
                    title={confirmButton.title}
                    onClick={() => this.onConfirmClick()}
                    type='button'
                    className='btn btn-primary'
                >
                    <span data-localize='actions.save_select.title'>{confirmButton.caption}</span>
                </button>
            </Modal.Footer>

        );
    }
}
