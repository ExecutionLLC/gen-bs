import React, {Component} from 'react';
import {filterBuilderStartEdit} from '../../../actions/filterBuilder';
import _ from 'lodash';


export default class FiltersSetup extends Component {

    constructor(props) {
        super(props);
    }

    onFiltersClick() {
        const {filtersList, fields, dispatch, openModal} = this.props;
        const selectedFilter = _.find(filtersList.filters, {id: filtersList.selectedFilterId});
        dispatch(filterBuilderStartEdit(false, selectedFilter, fields));
        openModal('filters');
    }
    
    render() {
        return (

            <div className='table-cell'>
                <div className='btn-group' data-localize='filters.setup.help' data-toggle='tooltip'
                     data-placement='bottom' data-container='body'
                     title='Select existing filter or create a new one'>
                    <button
                        className='btn btn-default'
                        type='button'
                        data-toggle='modal'
                        data-target='#filter'
                        onClick={() => this.onFiltersClick()}
                    >
                        <span data-localize='filters.setup.title'>Filters</span>
                    </button>
                </div>
            </div>


        );
    }
}
