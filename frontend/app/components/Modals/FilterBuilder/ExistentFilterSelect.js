import React, {Component} from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {
    filterBuilderSelectFilter,
    filterBuilderToggleNewEdit,
    filterBuilderDeleteFilter
} from '../../../actions/filterBuilder'


export default class ExistentFilterSelect extends Component {

    render() {

        const {dispatch, auth, fields} = this.props;
        const {selectedFilter} = this.props.filterBuilder;
        const {filters} = this.props.userData;
        const disabledClass = classNames({
            'disabled': (auth.isDemo) ? 'disabled' : ''
        });
        const title = (auth.isDemo) ? 'Login or register to work with filter' : 'Make a copy for editing';
        const isFilterEditable = (selectedFilter.type === 'user');

        return (

            <div className="in copyview">
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
                            options={filters.map( filter => { return {value: filter.id, label: getItemLabelByNameAndType(filter.name, filter.type)} } )}
                            value={selectedFilter.id}
                            clearable={false}
                            onChange={ (val) => {
                                dispatch(filterBuilderSelectFilter(filters, val.value));
                                dispatch(filterBuilderToggleNewEdit(false, fields));
                            }}
                        />
                    </div>
                    <div className="col-xs-4 col-sm-6">
                        <div className="btn-group" data-localize="actions.duplicate.help" data-toggle="tooltip"
                             data-placement="bottom" data-container="body">
                            <button type="button"
                                    className="btn btn-default in copyview"
                                    id="dblBtn"
                                    onClick={ () => dispatch(filterBuilderToggleNewEdit(true, fields)) }
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
                                    onClick={() => {
                                        dispatch(filterBuilderSelectFilter(filters, selectedFilter.id));
                                        dispatch(filterBuilderToggleNewEdit(false, fields));
                                    }}
                            >
                                <span data-localize="views.setup.reset.title" className="hidden-xs">Reset Filter</span>
                                <span className="visible-xs"><i className="md-i">setting_backup_restore</i></span>
                            </button>
                        </div>
                        }
                        { isFilterEditable &&
                        <div className="btn-group ">
                            <button type="button"
                                    className="btn btn-default"
                                    onClick={ () => dispatch(filterBuilderDeleteFilter(selectedFilter.id))}>
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
