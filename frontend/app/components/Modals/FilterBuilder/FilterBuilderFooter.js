import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames';

import {filterBuilderRequestRules, filterBuilderSaveAndSelectRules} from '../../../actions/filterBuilder';


export default class FilterBuilderFooter extends Component {

    render() {
        const {dispatch, auth, closeModal} = this.props;
        const {editOrNew, editedFilter, newFilter} = this.props.filterBuilder;
        const filter = editOrNew ? (editedFilter) : (newFilter);

        const disabledClass = classNames({
            'disabled': (filter.type === 'advanced' && auth.isDemo) ? 'disabled' : ''
        });
        const title = (filter.type === 'advanced' && auth.isDemo) ? 'Login or register to select advanced filters' : '';
        const isFilterEditable = (filter.type === 'user');
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
                        dispatch(filterBuilderSaveAndSelectRules())
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
