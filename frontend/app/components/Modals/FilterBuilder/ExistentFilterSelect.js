import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';

import { filterBuilderSelectFilter, filterBuilderToggleNewEdit} from '../../../actions/filterBuilder'


export default class ExistentFilterSelect extends Component {

    render() {

        const { dispatch, auth } = this.props;
        const { currentFilter} = this.props.filterBuilder;
        const { filters } = this.props.userData;
        const disabledClass = classNames({
            'disabled': (auth.isDemo) ? 'disabled' : ''
        });
        const title = (auth.isDemo) ? 'Login or register to create filters' : 'Make a copy for editing';
        const isFilterEditable = (currentFilter.type === 'user');

        return (

            <div className="collapse in copyview">
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <label data-localize="views.setup.selector.label">Available Filters</label>
                    </div>
                </div>
                { isFilterEditable &&
                    <div className="alert alert-help">
                        <span data-localize="views.setup.selector.description">This filter is not editable, duplicate it to make changes.</span>
                    </div>
                }
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <Select
                            options={filters.map( v => { return {value: v.id, label: v.name} } )}
                            value={currentFilter.id}
                            clearable={false}
                            onChange={ (val) => dispatch(filterBuilderSelectFilter(filters, val.value, true))}
                        />
                    </div>
                    <div className="col-sm-6">
                        <div className="btn-group" data-localize="actions.duplicate.help" data-toggle="tooltip"
                             data-placement="bottom" data-container="body">
                            <button type="button"
                                    className="btn btn-default collapse in copyview"
                                    data-toggle="collapse" data-target=".copyview"
                                    id="dblBtn"
                                    onClick={ () => dispatch(filterBuilderToggleNewEdit(false))}
                                    disabled={disabledClass}
                                    title={title}
                            >
                                <span data-localize="actions.duplicate.title">Duplicate</span>
                            </button>
                        </div>
                        {
                            //<!--   Видимы когда в селекторе выбраны пользовательские вью, которые можно редактировать -->
                        }
                        { isFilterEditable &&
                        <div className="btn-group ">
                            <button type="button" className="btn btn-default"
                                    onClick={() => dispatch(filterBuilderSelectFilter(filters, currentFilter.id, true))}
                            >
                                <span data-localize="views.setup.reset.title">Reset Filter</span>
                            </button>
                        </div>
                        }
                        { isFilterEditable &&
                        <div className="btn-group ">
                            <button type="button" className="btn btn-link">
                                <span data-localize="views.setup.delete.title">Delete Filter</span>
                            </button>
                        </div>
                        }
                    </div>
                </div>
            </div>

        )
    }
}
