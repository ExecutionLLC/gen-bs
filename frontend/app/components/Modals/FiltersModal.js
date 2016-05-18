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

        const {isValid} = this.props.userData;
        const {editingFilter} = this.props.filterBuilder;
        const editingFilterIsNew = editingFilter ? editingFilter.isNew : false;

        const {filters} = this.props.filtersList;
        const filterNameExists = editingFilter && _.some(filters, filter => filter.name == editingFilter.filter.name);
        const titleValidationMessage =
            filterNameExists ? 'Filter with this name is already exists.' :
                editingFilter && !editingFilter.filter.name ? 'Filter name cannot be empty' :
                    '';

        const {auth} = this.props;

        const isFilterEditable = editingFilter && editingFilter.filter.type === 'user';
        const filterNameExists2 = isFilterEditable && _(filters)
                .filter(filter => filter.type === 'user')
                .some(filter => filter.name.trim() == editingFilter.filter.name.trim()
                    && filter.id != editingFilter.filter.id
                );
        const disabledClass = classNames({
            'disabled': (editingFilter && editingFilter.filter.type === 'advanced' && auth.isDemo || (editingFilter && !editingFilter.filter.name.trim()) || filterNameExists2) ? 'disabled' : ''
        });
        const title = (editingFilter && editingFilter.filter.type === 'advanced' && auth.isDemo) ? 'Login or register to select advanced filters' : '';
        const selectButtonLabel = isFilterEditable ? 'Save and Select': 'Select';

        return (

            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={this.props.showModal}
                onHide={() => this.onClose()}
            >
                { (!isValid || !editingFilter) &&
                <div >&nbsp;</div>
                }
                { (isValid && editingFilter) &&
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
                            confirmButton={{caption: selectButtonLabel, title: title, disabled: disabledClass}}
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

