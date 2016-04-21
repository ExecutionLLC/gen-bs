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
        const title = (auth.isDemo) ? 'Login or register to work with filter' : 'Make a copy for editing';
        const isFilterEditable = (currentFilter.type === 'user');

        return (

            <div className="collapse in copyview">
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <label data-localize="views.setup.selector.label">Available Filters</label>
                    </div>
                </div>
                { !isFilterEditable &&
                    <div className="alert alert-help">
                        <span data-localize="views.setup.selector.description">
                            This filter is not editable, duplicate it to make changes. (Only for registered users)
                        </span>
                    </div>
                }
                <div className="row grid-toolbar row-head-selector">
                    <div className="col-xs-8 col-sm-6">
                        <Select
                            options={filters.map( filter => { return {value: filter.id, label: filter.name} } )}
                            value={currentFilter.id}
                            clearable={false}
                            onChange={ (val) => dispatch(filterBuilderSelectFilter(filters, val.value, true))}
                        />
                    </div>
                    <div className="col-xs-4 col-sm-6">
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
                                <span data-localize="actions.duplicate.title" className="hidden-xs">Duplicate</span>
                                <span className="visible-xs"><i className="md-i">content_copy</i></span>
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
                                <span data-localize="views.setup.reset.title" className="hidden-xs">Reset Filter</span>
                                <span className="visible-xs"><i className="md-i">setting_backup_restore</i></span>
                            </button>
                        </div>
                        }
                        { isFilterEditable &&
                        <div className="btn-group ">
                            <button type="button" className="btn btn-link">
                                <span data-localize="views.setup.delete.title">Delete Filter</span>
                                <span className="visible-xs"><i className="md-i">close</i></span>
                            </button>
                        </div>
                        }
                    </div>
                </div>
            </div>

        )
    }
}
