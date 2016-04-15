import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {viewBuilderDeleteColumn, viewBuilderAddColumn, viewBuilderChangeColumn} from '../../../actions/viewBuilder'


export default class ViewBuilder extends React.Component {

    render() {
        const {dispatch, fields, viewBuilder} = this.props;
        const view = viewBuilder.editedView;
        var disabledClass = classNames({
            'disabled': (view.type !== 'user') ? 'disabled' : ''
        });

        const previouslySelectedFieldIds = view.viewListItems.map(viewItem => viewItem.fieldId);
        const isDisableEditing = view.type !== 'user';
        const allAvailableFields = fields.sampleFieldsList.concat(fields.sourceFieldsList);
        // Exclude editable fields and fields that are already selected.
        const fieldsForSelection = _.filter(allAvailableFields, field => !field.isEditable
        && !_.includes(previouslySelectedFieldIds, field.id));
        const selects = view.viewListItems.map(function (viewItem, index) {

            var currentValue =
                _.find(fields.totalFieldsList, {id: viewItem.fieldId}) ||
                {id: null};
            const isFieldAvailable = _.some(allAvailableFields, {id: viewItem.fieldId}) || currentValue.id == null;
            const selectOptions = [

                ...fieldsForSelection.map((f) => {
                    return {value: f.id, label: `${f.name} -- ${f.sourceName}`}
                })
            ];
            return (

                <div className="row grid-toolbar" key={Math.round(Math.random()*100000000).toString()}>

                    <div className="col-xs-6 btn-group-select2">
                        <div className="btn-group">
                            <button className="btn btn-link btnDrag" disabled="" type="button">
                                <span className="icon-bar"/>
                                <span className="icon-bar"/>
                                <span className="icon-bar"/>
                            </button>
                        </div>
                        <div className="btn-group">
                            <Select
                                options={selectOptions}
                                value={currentValue}
                                clearable={false}
                                onChange={ (val) => dispatch(viewBuilderChangeColumn(index, val.value)) }
                                disabled={isDisableEditing || !isFieldAvailable}
                            />
                        </div>
                        <div className="btn-group" data-localize="views.setup.settings.sort" data-toggle="tooltip"
                             data-placement="bottom" data-container="body" title="Desc/Asc Descending">
                            <button type="button" className="btn btn-default btn-sort active desc" disabled/>
                        </div>

                    </div>
                    <div className="col-xs-5 input-group">

                        <input type="text" className="form-control" placeholder="Keywords (Optional)" id="cFl1" value=""
                               readOnly="" data-localize="views.setup.settings.keywords"/>
                    </div>

                    <div className="col-xs-1">
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }><i
                            className="fa fa-lg fa-minus-circle"/></button>
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderAddColumn(index+1)) }><i
                            className="fa fa-lg fa-plus-circle"/></button>
                    </div>
                </div>
            )
        }.bind(this));

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

function mapStateToProps(state) {
    const {viewBuilder, userData: {views}, fields} = state;
    return {
        viewBuilder,
        views,
        fields
    }
}

export default connect(mapStateToProps)(ViewBuilder);
