import React, {Component} from 'react';
import Select from '../../shared/Select';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {filtersListSelectFilter} from '../../../actions/filtersList';

export default class Filters extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const dispatch = this.props.dispatch;
        const selectedFilterId = this.props.filtersList.selectedFilterId;

        return (
            <div className='table-cell max-width'>
                <div className='btn-group filter-select'
                     data-localize='filters.help'
                     data-toggle='tooltip'
                     data-placement='bottom'
                     data-container='body'
                     title='Select one of available filters'
                >
                    <Select options={this.getFilterOptions()}
                            value={selectedFilterId}
                            onChange={(item) => {
                                dispatch(filtersListSelectFilter(item.value));
                            }}
                    />
                </div>
            </div>
        );
    }

    isFilterDisabled(filter) {
        const {auth} = this.props;
        return auth.isDemo && filter.type == 'advanced';
    }

    getFilterOptions() {
        const {filters} = this.props.filtersList;
        return filters.map((filterItem) => {
            const isDisabled = this.isFilterDisabled(filterItem);
            const label = getItemLabelByNameAndType(filterItem.name, filterItem.type);
            return {
                value: filterItem.id, label, disabled: isDisabled
            };
        }
        );
    }
}
