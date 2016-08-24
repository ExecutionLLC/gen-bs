import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import _ from 'lodash';

import config from '../../../config';
import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader';
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter';
import FilterBuilder from './FilterBuilder/FilterBuilder';
import {filterBuilderEndEdit} from '../../actions/filterBuilder';
import ExistentFilterSelect from './FilterBuilder/ExistentFilterSelect';
import NewFilterInputs from './FilterBuilder/NewFilterInputs';
import {entityType, entityTypeIsEditable, entityTypeIsDemoDisabled} from '../../utils/entityTypes';

class FiltersModal extends Component {

    onClose() {
        this.props.closeModal('filters');
        this.props.dispatch(filterBuilderEndEdit());
    }

    render() {
        const {auth: {isDemo}} = this.props;
        const filters = this.props.filtersList.hashedArray.array;
        const editingFilterObject = this.props.filterBuilder.editingFilter;
        const editingFilterIsNew = editingFilterObject ? editingFilterObject.isNew : false;
        const editingFilter = editingFilterObject && editingFilterObject.filter;
        const isFilterEditable = editingFilter && entityTypeIsEditable(editingFilter.type);
        const isLoginRequired = editingFilter && entityTypeIsDemoDisabled(editingFilter.type, isDemo);
        const editingFilterNameTrimmed = editingFilter && editingFilter.name.trim();

        const titleValidationMessage = this.getValidationMessage(
            editingFilter,
            isFilterEditable,
            editingFilterNameTrimmed,
            filters
        );

        const confirmButtonParams = {
            caption: isFilterEditable ? 'Save and Select': 'Select',
            title: isLoginRequired ? 'Login or register to select advanced filters' : '',
            disabled: isLoginRequired || !!titleValidationMessage
        };

        return (

            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={this.props.showModal}
                onHide={() => this.onClose()}
            >
                { (!editingFilter) &&
                <div>&nbsp;</div>
                }
                { (editingFilter) &&
                <div>
                    <FilterBuilderHeader />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <NewFilterInputs
                                        {...this.props}
                                        validationMessage={titleValidationMessage}
                                    />
                                    <FilterBuilder
                                        {...this.props}
                                    />
                                </div>
                                }
                                { !editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <ExistentFilterSelect {...this.props} />
                                    <FilterBuilder
                                        {...this.props}
                                    />
                                </div>
                                }
                            </div>
                        </Modal.Body>
                        <FilterBuilderFooter
                            dispatch={this.props.dispatch}
                            confirmButtonParams={confirmButtonParams}
                            closeModal={() => this.onClose()}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }

    getValidationMessage(editingFilter, isFilterEditable, editingFilterName, filters) {
        const filterNameExists = isFilterEditable && _(filters)
                .filter(filter => filter.type !== entityType.HISTORY)
                .some(filter => filter.name.trim() === editingFilterName
                    && filter.id != editingFilter.id
                );
        if (filterNameExists) {
            return 'Filter with this name is already exists.';
        }

        if (editingFilter && !editingFilterName) {
            return 'Name cannot be empty';
        }

        if (editingFilter && editingFilterName && editingFilterName.length > config.FILTERS.MAX_NAME_LENGTH) {
            return `Name length should be less than ${config.FILTERS.MAX_NAME_LENGTH}`;
        }

        return '';
    }
}


function mapStateToProps(state) {
    const { filterBuilder, ui, auth, fields, filtersList } = state;

    return {
        fields,
        ui,
        filterBuilder,
        auth,
        filtersList
    };
}

export default connect(mapStateToProps)(FiltersModal);

