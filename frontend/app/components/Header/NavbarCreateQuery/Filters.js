import React, {Component} from 'react';
import Select from 'react-select';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {changeFilter} from '../../../actions/ui'
import {filtersListSelectFilter} from "../../../actions/filtersList";

export default class Filters extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        const dispatch = this.props.dispatch;
        const selectedFilter = this.props.ui.selectedFilter;

        return (
            <div className="table-cell max-width">
                <div className="btn-group filter-select"
                     data-localize="filters.help"
                     data-toggle="tooltip"
                     data-placement="bottom"
                     data-container="body"
                     title="Select one of available filters"
                >
                    <Select options={this.getFilterOptions()}
                            value={selectedFilter ? selectedFilter.id : null}
                            clearable={false}
                            onChange={(item) => {
                                dispatch(changeFilter(item.value));
                                dispatch(filtersListSelectFilter(item.value));
                            }}
                    />
                </div>
            </div>
        )
    }

    isFilterDisabled(filter) {
        const {auth} = this.props;
        return auth.isDemo && filter.type == 'advanced';
    }

    getFilterOptions() {
        const filters = this.props.userData.filters;
        return filters.map((filterItem) => {
                const isDisabled = this.isFilterDisabled(filterItem);
                const label = getItemLabelByNameAndType(filterItem.name, filterItem.type);
                return {
                    value: filterItem.id, label, disabled: isDisabled
                }
            }
        )
    }
}
