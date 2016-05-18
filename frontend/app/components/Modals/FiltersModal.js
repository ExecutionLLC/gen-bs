import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import _ from 'lodash';
import classNames from 'classnames';

import FilterBuilderHeader from './FilterBuilder/FilterBuilderHeader';
import FilterBuilderFooter from './FilterBuilder/FilterBuilderFooter';
import FilterBuilder from './FilterBuilder/FilterBuilder';
import {filterBuilderEndEdit} from '../../actions/filterBuilder';
import ExistentFilterSelect from './FilterBuilder/ExistentFilterSelect';
import NewFilterInputs from './FilterBuilder/NewFilterInputs';

class FiltersModal extends Component {

    onClose() {
        this.props.closeModal('filters');
        this.props.dispatch(filterBuilderEndEdit());
    }

    render() {
        const {auth} = this.props;
        const {filters} = this.props.filtersList;
        const editingFilterObject = this.props.filterBuilder.editingFilter;
        const editingFilterIsNew = editingFilterObject ? editingFilterObject.isNew : false;
        const editingFilter = editingFilterObject && editingFilterObject.filter;
        const isFilterEditable = editingFilter && editingFilter.type === 'user';
        const editingFilterNameTrimmed = editingFilter && editingFilter.name.trim();

        const filterNameExists = isFilterEditable && _(filters)
                .filter(filter => filter.type !== 'history')
                .some(filter => filter.name.trim() === editingFilterNameTrimmed
                    && filter.id != editingFilter.id
                );

        const titleValidationMessage =
            filterNameExists ? 'Filter with this name is already exists.' :
                editingFilter && !editingFilterNameTrimmed ? 'Filter name cannot be empty' :
                    '';

        const confirmButtonDisabled = editingFilter && editingFilter.type === 'advanced' && auth.isDemo || !!titleValidationMessage;
        const title = (editingFilter && editingFilter.type === 'advanced' && auth.isDemo) ? 'Login or register to select advanced filters' : '';
        const selectButtonLabel = isFilterEditable ? 'Save and Select': 'Select';

        return (

            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={this.props.showModal}
                onHide={() => this.onClose()}
            >
                { (!editingFilter) &&
                <div >&nbsp;</div>
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
                            {...this.props}
                            confirmButton={{caption: selectButtonLabel, title: title, disabled: confirmButtonDisabled}}
                            closeModal={() => this.onClose()}
                        />
                    </form>
                </div>
                }
            </Modal>

        );
    }
}


function mapStateToProps(state) {
    const { filterBuilder, ui, auth, userData, fields, samplesList, filtersList } = state;

    return {
        userData,
        fields,
        ui,
        filterBuilder,
        auth,
        samplesList,
        filtersList
    };
}

export default connect(mapStateToProps)(FiltersModal);

