import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames';

import {filterBuilderSaveAndSelectRules} from '../../../actions/filterBuilder';


export default class FilterBuilderFooter extends Component {

    render() {
        const {dispatch, auth, closeModal} = this.props;
        const {filters} = this.props.userData;
        const editingFilter = this.props.filterBuilder.editingFilter.filter;

        const filterNameExists = _.some(filters, filter => filter.name == editingFilter.name);
        const disabledClass = classNames({
            'disabled': (editingFilter.type === 'advanced' && auth.isDemo || !editingFilter.name.trim()||filterNameExists) ? 'disabled' : ''
        });
        const title = (editingFilter.type === 'advanced' && auth.isDemo) ? 'Login or register to select advanced filters' : '';
        const isFilterEditable = (editingFilter.type === 'user');
        const selectButtonLabel = isFilterEditable ? 'Save and Select': 'Select';

        return (
            <Modal.Footer>
                <button
                    onClick={ () => { closeModal('filters')} }
                    type="button"
                    className="btn btn-default"
                    data-dismiss="modal"
                >
                    <span data-localize="actions.cancel">Cancel</span>
                </button>

                <button
                    disabled={disabledClass}
                    title={title}
                    onClick={ () => {
                        if (editingFilter.name.trim()) {
                            dispatch(filterBuilderSaveAndSelectRules())
                        }
                    }}
                    type="button"
                    className="btn btn-primary"
                >
                    <span data-localize="actions.save_select.title">{selectButtonLabel}</span>
                </button>
            </Modal.Footer>

        )
    }
}
