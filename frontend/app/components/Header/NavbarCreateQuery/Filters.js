import React, { Component } from 'react';
import Select from 'react-select';

import { changeFilter } from '../../../actions/ui'

export default class Filters extends Component {

    constructor(props) {
        super(props)
    }

    render() {
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
                    <Select options={this.getFilterOptions()}
                            value={currentFilter ? currentFilter.id : null}
                            clearable={false}
                            onChange={(item) => dispatch(changeFilter(item.value))}
                    />
                </div>
            </div>
        )
    }

    isFilterDisable(filter){
        const {auth} = this.props;
        if (auth.isDemo &&filter.type=='advanced'){
            return true;
        }else {
            return false;
        }
    }

    getFilterOptions() {
        const filters = this.props.userData.filters;
        return filters.map(f => {
                const isDisable = this.isFilterDisable(f);
                return {
                    value: f.id, label: f.name, disabled: isDisable
                }
            }
        )
    }
}
