import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';

import { viewBuilderDeleteColumn, viewBuilderAddColumn, viewBuilderChangeColumn } from '../../../actions/viewBuilder'


export default class ViewBuilder extends Component {

    render() {
        const { dispatch, fields } = this.props
        const view = this.props.viewBuilder.editOrNew ? (this.props.viewBuilder.editedView) : (this.props.viewBuilder.newView)
        var disabledClass = classNames({
            'disabled': (view.type !== 'user') ? 'disabled' : ''
        });

        const previouslySelectedFields = view.view_list_items.map(viewItem => viewItem.field_id);
        const isDisableEditing = view.type !== 'user';
        const selects = view.view_list_items.map(function (viewItem, index) {

            var currentValue =
                _.find(fields.list, {id: viewItem.field_id}) ||
                _.find(fields.sourceFieldsList, {id: viewItem.field_id}) ||
                {id: null}

            const selectOptions = [

                ...fields.list.filter((f) => !_.includes(previouslySelectedFields, f.id)).map((f) => {
                    return {value: f.id, label: `${f.name} -- ${f.source_name}`}
                }),

                ...fields.sourceFieldsList.filter((f) => !_.includes(previouslySelectedFields, f.id) && (f.source_name !== 'sample')).map((f) => {
                    return {value: f.id, label: `${f.name} -- ${f.source_name}`}
                })

            ]

            return (

                <div className="row grid-toolbar" key={Math.round(Math.random()*100000000).toString()}>

                    <div className="col-xs-6 btn-group-select2">
                        <div className="btn-group">
                            <button className="btn btn-link btnDrag" disabled="">
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                            </button>
                        </div>
                        <div className="btn-group">
                            <Select
                                options={selectOptions}
                                value={currentValue}
                                clearable={false}
                                onChange={ (val) => dispatch(viewBuilderChangeColumn(index, val.value)) }
                                disabled={isDisableEditing}
                            />
                        </div>
                        <div className="btn-group" data-localize="views.setup.settings.sort" data-toggle="tooltip"
                             data-placement="bottom" data-container="body" title="Desc/Asc Descending">
                            <button type="button" className="btn btn-default btn-sort active desc" disabled></button>
                        </div>

                    </div>
                    <div className="col-xs-5 input-group">
                  <span className="input-group-addon" data-localize="views.setup.settings.filter" data-toggle="tooltip"
                        data-placement="bottom" data-container="body" title="Column Filter">
                    <input type="checkbox" id="cCh1" checked="" disabled=""/>
                  </span>

                        <input type="text" className="form-control" placeholder="Keywords (Optional)" id="cFl1" value=""
                               readOnly="" data-localize="views.setup.settings.keywords"/>
                    </div>

                    <div className="col-xs-1">
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }><i
                            className="fa fa-lg fa-minus-circle"></i></button>
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderAddColumn(index)) }><i
                            className="fa fa-lg fa-plus-circle"></i></button>
                    </div>
                </div>
            )
        }.bind(this))

        return (

            <div className="sort-setting copyview collapse in">
                <h5 data-localize="views.setup.settings.title">Table Columns</h5>
                <div className="row grid-toolbar nobg">

                    <div className="col-xs-6">
                        <small className="text-muted text-order" data-localize="views.setup.settings.columns_order">
                            Order
                        </small>
                        <small className="text-muted" data-localize="views.setup.settings.columns_sorting">Column Name
                            and Multi Sort Order
                        </small>
                    </div>

                    <div className="col-xs-6">
                        <small className="text-muted" data-localize="views.setup.settings.columns_filter">Column Filter
                            and Keywords
                        </small>
                    </div>
                </div>

                {selects}
            </div>

        )
    }
}
