import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {viewBuilderDeleteColumn, viewBuilderAddColumn, viewBuilderChangeColumn} from '../../../actions/viewBuilder'
import {viewBuilderChangeSortColumn, viewBuilderChangeKeywords} from "../../../actions/viewBuilder";


export default class ViewBuilder extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.viewBuilder.editedView.type !== nextProps.viewBuilder.editedView.type
            || this.props.viewBuilder.editedView.viewListItems !== nextProps.viewBuilder.editedView.viewListItems;
    }

    render() {
        const {dispatch, fields, viewBuilder} = this.props;
        const view = viewBuilder.editedView;
        var disabledClass = classNames({
            'disabled': (view.type !== 'user') ? 'disabled' : ''
        });

        const previouslySelectedFieldIds = view.viewListItems.map(viewItem => viewItem.fieldId);
        const isDisableEditing = view.type !== 'user';
        const allAvailableFields = fields.allowedFieldsList;
        // Exclude fields that are already selected.
        const fieldsForSelection = _.filter(
            allAvailableFields,
            field => !_.includes(previouslySelectedFieldIds, field.id)
        );
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
            const {sortOrder, sortDirection, fieldId} = viewItem;
            const ascSortBtnClasses = this.getSortButtonClasses(sortOrder, sortDirection);

            //keywords
            const currentValueKeywordsHash = this.createFieldKeywordsHash(currentValue);
            const keywordsCurrentValue = this.createCurrentKeywordValues(viewItem, currentValueKeywordsHash);
            const keywordsSelectOptions = this.createFieldKeywordsSelectOptions(currentValue);

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
                            {this.renderSortButton(sortDirection, ascSortBtnClasses, sortOrder, fieldId, isDisableEditing)}
                        </div>

                    </div>
                    <div className="col-xs-5 input-group">
                        <Select
                            options={keywordsSelectOptions}
                            multi={true}
                            placeholder={(keywordsSelectOptions.length) ?'Choose keywords':'No keywords defined for the field'}
                            value={keywordsCurrentValue}
                            onChange={ (val) => this.onChangeKeyword(index, val)}
                            clearable={false}
                            disabled={isDisableEditing || !isFieldAvailable ||!keywordsSelectOptions.length}
                        />
                    </div>

                    <div className="col-xs-1">
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }
                                type="button">
                            <i className="fa fa-lg fa-minus-circle"/></button>
                        <button className="btn-link" disabled={disabledClass}
                                onClick={ () => dispatch(viewBuilderAddColumn(index+1)) }
                                type="button">
                            <i className="fa fa-lg fa-plus-circle"/></button>
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

    createCurrentKeywordValues(viewItem, keywords) {
        return [
            ...viewItem.keywords.map((keywordId) => {
                const currentKeyword = keywords[keywordId];
                return {value: currentKeyword.synonyms[0].keywordId, label: `${currentKeyword.synonyms[0].value}`}
            })
        ];
    };

    createFieldKeywordsHash(field) {
        if (!field.id) {
            return {};
        } else {
            return _.reduce(field.keywords, (result, keyword) => {
                result[keyword.id] = keyword;
                return result;
            }, {});
        }
    }

    createFieldKeywordsSelectOptions(field) {
        if (!field.id) {
            return [];
        } else {
            return [

                ...field.keywords.map((keyword) => {
                    return {value: keyword.synonyms[0].keywordId, label: `${keyword.synonyms[0].value}`}
                })
            ];
        }
    }

    getSortButtonClasses(order, sortDirection) {
        if (!order && !sortDirection) {
            return classNames(
                'btn',
                'btn-sort',
                'btn-default'
            );
        }
        else {
            return classNames(
                'btn',
                'btn-sort', sortDirection, {
                    'active': true
                }
            );
        }
    }

    renderSortButton(currentDirection, sortButtonClass, sortOrder, fieldId, isDisable) {
        return (
            <button className={sortButtonClass}
                    type="button"
                    disabled={isDisable}
                    onClick={ e => this.onSortClick(currentDirection, e.ctrlKey || e.metaKey, fieldId )}>
                <span className="text-info">{sortOrder}</span>
            </button>
        );
    }

    onSortClick(direction, isControlKeyPressed, fieldId) {
        const {dispatch} = this.props;
        dispatch(viewBuilderChangeSortColumn(fieldId, direction, isControlKeyPressed));
    }

    onChangeKeyword(index, keywordValues) {
        const {dispatch} = this.props;
        dispatch(
            viewBuilderChangeKeywords(
                index, _.map(
                    keywordValues, keywordValue => keywordValue.value
                )
            )
        );
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
