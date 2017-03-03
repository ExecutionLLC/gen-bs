import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import _ from 'lodash';
import {getP} from 'redux-polyglot/dist/selectors';

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


class FiltersModal extends Component {

    // Texts that differs filter builder from model builder
    getFilterBuilderTexts(strategyName) {
        const {p} = this.props;
        switch (strategyName) {
            case filterBuilderStrategyName.FILTER:
                return {
                    getStrategyValidationMessage(/*filter, strategyData*/) {
                        return '';
                    },
                    p(path) {
                        return p.t(`filterAndModel.texts.filters.${path}`);
                    }
                };
            case filterBuilderStrategyName.MODEL:
                return {
                    getStrategyValidationMessage(model, strategyData) {
                        return model.analysisType === strategyData.analysisType ?
                            '' :
                            p.t('filterAndModel.modelMismatch');
                    },
                    p(path) {
                        return p.t(`filterAndModel.texts.models.${path}`);
                    }
                };
        }
    }

    onClose() {
        const {dispatch, closeModal} = this.props;
        closeModal();
        dispatch(filterBuilderEndEdit());
    }

    render() {
        const {dispatch, auth: {isDemo}, filterBuilder, showModal, p} = this.props;
        const filters = filterBuilder.filtersList && filterBuilder.filtersList.hashedArray.array;
        const editingFilterObject = filterBuilder.editingFilter;
        const editingFilterIsNew = editingFilterObject ? editingFilterObject.isNew : false;
        const editingFilter = editingFilterObject && editingFilterObject.filter;
        const isFilterEditable = editingFilter && entityTypeIsEditable(editingFilter.type);
        const isLoginRequired = editingFilter && entityTypeIsDemoDisabled(editingFilter.type, isDemo);
        const editingFilterNameTrimmed = editingFilter && this.getTrimmedFilterName(editingFilter);
        const texts = filterBuilder.filtersStrategy ? this.getFilterBuilderTexts(filterBuilder.filtersStrategy.name) : {};

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
            texts.p('loginRequiredMsg') :
            strategyValidationMessage;

        const confirmButtonParams = {
            caption: isFilterEditable ? p.t('filterAndModel.saveAndSelect') : p.t('filterAndModel.select'),
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
                        p={p}
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
                                        p={p}
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
                            p={p}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }

    getTrimmedFilterName(filter) {
        const {ui: {languageId}} = this.props;
        return i18n.getEntityText(filter, languageId).name.trim();
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
            return texts.p('validationMessage.nameAlreadyExists');
        }

        if (!editingFilterName) {
            return texts.p('validationMessage.empty');
        }

        if (editingFilterName && editingFilterName.length > config.FILTERS.MAX_NAME_LENGTH) {
            return texts.p('validationMessage.lengthExceeded', {maxLength: config.FILTERS.MAX_NAME_LENGTH});
        }

        return '';
    }
}


function mapStateToProps(state) {
    const {filterBuilder, ui, auth, fields} = state;

    return {
        fields,
        ui,
        filterBuilder,
        auth,
        p: getP(state)
    };
}

FiltersModal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(FiltersModal);

