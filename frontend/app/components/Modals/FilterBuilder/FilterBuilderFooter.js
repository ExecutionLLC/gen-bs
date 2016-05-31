import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';

import {filterBuilderSaveAndSelectRules} from '../../../actions/filterBuilder';

export default class FilterBuilderFooter extends Component {

    render() {
        const {confirmButtonParams} = this.props;

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
                    disabled={confirmButtonParams.disabled}
                    title={confirmButtonParams.title}
                >
                    <span data-localize='actions.save_select.title'>{confirmButtonParams.caption}</span>
                </button>
            </Modal.Footer>
        );
    }

    onCancelClick() {
        this.props.closeModal();
    }

    onConfirmClick() {
        this.props.dispatch(filterBuilderSaveAndSelectRules());
    }

}
