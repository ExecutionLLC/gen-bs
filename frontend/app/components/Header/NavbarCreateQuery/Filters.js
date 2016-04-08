import React, { Component } from 'react';
import Select from 'react-select';

import { changeFilter } from '../../../actions/ui'

export default class Filters extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        const filters = this.props.userData.filters;
        const dispatch = this.props.dispatch;
        const currentFilter = this.props.ui.currentFilter;

        return (
            <div className="table-cell max-width">
                <div className="btn-group filter-select"
                     data-localize="filters.help"
                     data-toggle="tooltip"
                     data-placement="bottom"
                     data-container="body"
                     title="Select one or more from available filters"
                >
                    <Select options={filters.map( filter => { return {value: filter.id, label: filter.name} } )}
                            value={currentFilter ? currentFilter.id : null}
                            clearable={false}
                            onChange={(item) => dispatch(changeFilter(item.value))}
                    />
                </div>
            </div>
        )
    }
}
