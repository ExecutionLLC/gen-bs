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


export const filterBuilderVerb = {
    'filter': {
        filter: 'filter',
        filters: 'filters',
        Filter: 'Filter',
        Filters: 'Filters',
        getStrategyValidationMessage(/*filter, strategyData*/) {
            return '';
        }
    },
    'model': {
        filter: 'model',
        filters: 'models',
        Filter: 'Model',
        Filters: 'Models',
        getStrategyValidationMessage(model, strategyData) {
            return model.analysisType === strategyData.analysisType ?
                '' :
                'Model analysis type mismatch';
        }
    }
};


class FiltersModal extends Component {

    onClose() {
        const {dispatch, closeModal} = this.props;
        closeModal('filters');
        dispatch(filterBuilderEndEdit());
    }

    render() {
        const {dispatch, auth: {isDemo}, filterBuilder, showModal} = this.props;
        const filters = filterBuilder.filtersList && filterBuilder.filtersList.hashedArray.array;
        const editingFilterObject = filterBuilder.editingFilter;
        const editingFilterIsNew = editingFilterObject ? editingFilterObject.isNew : false;
        const editingFilter = editingFilterObject && editingFilterObject.filter;
        const isFilterEditable = editingFilter && entityTypeIsEditable(editingFilter.type);
        const isLoginRequired = editingFilter && entityTypeIsDemoDisabled(editingFilter.type, isDemo);
        const editingFilterNameTrimmed = editingFilter && editingFilter.name.trim();
        const verb = filterBuilder.filtersStrategy ? filterBuilderVerb[filterBuilder.filtersStrategy.name] : {};

        const titleValidationMessage = editingFilter ? this.getValidationMessage(
            editingFilter,
            isFilterEditable,
            editingFilterNameTrimmed,
            filters,
            verb
        ) : '';

        const strategyValidationMessage = verb.getStrategyValidationMessage ?
            verb.getStrategyValidationMessage(editingFilter, filterBuilder.filtersStrategy) :
            '';

        const title = isLoginRequired ?
            `Login or register to select advanced ${verb.filters}` :
            strategyValidationMessage;

        const confirmButtonParams = {
            caption: isFilterEditable ? 'Save and Select': 'Select',
            title: title,
            disabled: !!title || !!titleValidationMessage
        };

        return (

            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
            >
                { (!editingFilter) &&
                <div>&nbsp;</div>
                }
                { (editingFilter) &&
                <div>
                    <FilterBuilderHeader
                        verb={verb}
                    />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <NewFilterInputs
                                        {...this.props}
                                        verb={verb}
                                        validationMessage={titleValidationMessage}
                                    />
                                    <FilterBuilder
                                        {...this.props}
                                        verb={verb}
                                    />
                                </div>
                                }
                                { !editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <ExistentFilterSelect
                                        verb={verb}
                                        {...this.props}
                                    />
                                    <FilterBuilder
                                        {...this.props}
                                        verb={verb}
                                    />
                                </div>
                                }
                            </div>
                        </Modal.Body>
                        <FilterBuilderFooter
                            dispatch={dispatch}
                            confirmButtonParams={confirmButtonParams}
                            closeModal={() => this.onClose()}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }

    /**
     * @param {Object}editingFilter
     * @param {boolean}isFilterEditable
     * @param {string}editingFilterName
     * @param {Array<Object>}filters
     * @param {Object.<string, string>}verb
     * @return {string}
     */
    getValidationMessage(editingFilter, isFilterEditable, editingFilterName, filters, verb) {
        const filterNameExists = isFilterEditable && _(filters)
                .filter(filter => filter.type !== entityType.HISTORY)
                .some(filter => filter.name.trim() === editingFilterName
                    && filter.id != editingFilter.id
                );
        if (filterNameExists) {
            return `${verb.Filter} with this name is already exists.`;
        }

        if (!editingFilterName) {
            return 'Name cannot be empty';
        }

        if (editingFilterName && editingFilterName.length > config.FILTERS.MAX_NAME_LENGTH) {
            return `Name length should be less than ${config.FILTERS.MAX_NAME_LENGTH}`;
        }

        return '';
    }
}


function mapStateToProps(state) {
    const { filterBuilder, ui, auth, fields } = state;

    return {
        fields,
        ui,
        filterBuilder,
        auth
    };
}

export default connect(mapStateToProps)(FiltersModal);

