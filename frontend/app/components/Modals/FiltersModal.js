import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import _ from 'lodash';

import config from '../../../config';
import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader';
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter';
import FilterBuilder from './FilterBuilder/FilterBuilder';
import {filterBuilderEndEdit, filterBuilderStrategyName} from '../../actions/filterBuilder';
import ExistentFilterSelect from './FilterBuilder/ExistentFilterSelect';
import NewFilterInputs from './FilterBuilder/NewFilterInputs';
import {entityType, entityTypeIsEditable, entityTypeIsDemoDisabled} from '../../utils/entityTypes';
import {modalName} from '../../actions/modalWindows';
import * as i18n from '../../utils/i18n';


// Texts that differs filter builder from model builder
export const filterBuilderTexts = {
    [filterBuilderStrategyName.FILTER]: {
        filter: 'filter',
        filters: 'filters',
        Filter: 'Filter',
        Filters: 'Filters',
        getStrategyValidationMessage(/*filter, strategyData*/) {
            return '';
        }
    },
    [filterBuilderStrategyName.MODEL]: {
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
        closeModal(modalName.FILTERS); // TODO: closeModal must have no params (it's obvious that we close upload)
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
        const editingFilterNameTrimmed = editingFilter && this.getTrimmedFilterName(editingFilter);
        const texts = filterBuilder.filtersStrategy ? filterBuilderTexts[filterBuilder.filtersStrategy.name] : {};

        const titleValidationMessage = editingFilter ? this.getValidationMessage(
            editingFilter,
            isFilterEditable,
            editingFilterNameTrimmed,
            filters,
            texts
        ) : '';

        const strategyValidationMessage = texts.getStrategyValidationMessage ?
            texts.getStrategyValidationMessage(editingFilter, filterBuilder.filtersStrategy) :
            '';

        const title = isLoginRequired ?
            `Login or register to select advanced ${texts.filters}` :
            strategyValidationMessage;

        const confirmButtonParams = {
            caption: isFilterEditable ? 'Save and Select' : 'Select',
            title: title,
            disabled: !!title || !!titleValidationMessage
        };

        return (

            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
                backdrop='static'
            >
                { (!editingFilter) &&
                <div>&nbsp;</div>
                }
                { (editingFilter) &&
                <div>
                    <FilterBuilderHeader
                        texts={texts}
                    />
                    <form>
                        <Modal.Body>
                            <div className='modal-body-scroll'>
                                { editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <NewFilterInputs
                                        {...this.props}
                                        texts={texts}
                                        validationMessage={titleValidationMessage}
                                    />
                                    <FilterBuilder
                                        {...this.props}
                                        texts={texts}
                                    />
                                </div>
                                }
                                { !editingFilterIsNew &&
                                <div className='modal-padding'>
                                    <ExistentFilterSelect
                                        texts={texts}
                                        {...this.props}
                                    />
                                    <FilterBuilder
                                        {...this.props}
                                        texts={texts}
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

    getTrimmedFilterName(filter) {
        const {ui: {language}} = this.props; // FIXME langu
        return i18n.getEntityText(filter, language).name.trim();
    }

    /**
     * @param {Object}editingFilter
     * @param {boolean}isFilterEditable
     * @param {string}editingFilterName
     * @param {Array<Object>}filters
     * @param {Object.<string, string>}texts
     * @return {string}
     */
    getValidationMessage(editingFilter, isFilterEditable, editingFilterName, filters, texts) {
        const filterNameExists = isFilterEditable && _(filters)
                .filter(filter => filter.type !== entityType.HISTORY
                // Next line is done to work with models. Filters have no analysis type.
                && filter.analysisType === editingFilter.analysisType)
                .some(filter => this.getTrimmedFilterName(filter) === editingFilterName
                    && filter.id != editingFilter.id
                );
        if (filterNameExists) {
            return `${texts.Filter} with this name is already exists.`;
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
    const {filterBuilder, auth, fields} = state;

    return {
        fields,
        filterBuilder,
        auth
    };
}

export default connect(mapStateToProps)(FiltersModal);

