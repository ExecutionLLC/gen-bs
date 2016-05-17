import React from 'react';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import {connect} from 'react-redux';
import _ from 'lodash';

import {viewBuilderDeleteColumn, viewBuilderAddColumn, viewBuilderChangeColumn} from '../../../actions/viewBuilder';
import {viewBuilderChangeSortColumn, viewBuilderChangeKeywords} from '../../../actions/viewBuilder';


export default class ViewBuilder extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.viewBuilder.editedView.type !== nextProps.viewBuilder.editedView.type
            || this.props.viewBuilder.editedView.viewListItems !== nextProps.viewBuilder.editedView.viewListItems;
    }

    render() {
        const {dispatch, fields, viewBuilder} = this.props;
        const allAvailableFields = fields.allowedFieldsList;
        const view = viewBuilder.editedView;
        const viewItemsLength = view.viewListItems.length;
        const previouslySelectedFieldIds = view.viewListItems.map(viewItem => viewItem.fieldId);
        // Exclude fields that are already selected.
        const fieldsForSelection = _.filter(
            allAvailableFields,
            field => !_.includes(previouslySelectedFieldIds, field.id)
        );
        // This field will be chosen when a new item is created.
        const nextDefaultField = _.first(fieldsForSelection);
        var plusDisabledClass = classNames({
            'disabled': (view.type !== 'user' || viewItemsLength >= 30 || !nextDefaultField) ? 'disabled' : ''
        });
        var minusDisabledClass = classNames({
            'disabled': (view.type !== 'user' || viewItemsLength <= 1) ? 'disabled' : ''
        });

        const isDisableEditing = view.type !== 'user';
        const selects = view.viewListItems.map(function (viewItem, index) {

            var currentValue =
                _.find(fields.totalFieldsList, {id: viewItem.fieldId}) ||
                {id: null};

            const isFieldAvailable = _.some(allAvailableFields, {id: viewItem.fieldId}) || currentValue.id == null;
            const selectOptions = [

                ...fieldsForSelection.map((f) => {
                    return {value: f.id, label: `${f.name} -- ${f.sourceName}`};
                })
            ];
            const {sortOrder, sortDirection, fieldId} = viewItem;
            const ascSortBtnClasses = this.getSortButtonClasses(sortOrder, sortDirection);

            //keywords
            const currentValueKeywordsHash = this.createFieldKeywordsHash(currentValue);
            const keywordsCurrentValue = this.createCurrentKeywordValues(viewItem, currentValueKeywordsHash);
            const keywordsSelectOptions = this.createFieldKeywordsSelectOptions(currentValue);

            return (

                <div className='row grid-toolbar' key={Math.round(Math.random()*100000000).toString()}>

                    <div className='col-xs-12 col-sm-6 btn-group-select2'>
                        <div className='btn-group btn-group-left'>
                            <button className='btn btn-link btnDrag' disabled='' type='button'>
                                <span className='icon-bar'/>
                                <span className='icon-bar'/>
                                <span className='icon-bar'/>
                            </button>
                        </div>
                        <div className='btn-group'>
                            <Select
                                options={selectOptions}
                                value={currentValue}
                                onChange={ (val) => dispatch(viewBuilderChangeColumn(index, val.value)) }
                                disabled={isDisableEditing || !isFieldAvailable}
                            />
                        </div>
                        <div className='btn-group' data-localize='views.setup.settings.sort' data-toggle='tooltip'
                             data-placement='bottom' data-container='body' title='Desc/Asc Descending'>
                            {this.renderSortButton(sortDirection, ascSortBtnClasses, sortOrder, fieldId, isDisableEditing)}
                        </div>
                    </div>
                    <div className='col-xs-12 col-sm-6 btn-group-select2'>
                        <div className='btn-group btn-group-select100'>
                            <Select
                                options={keywordsSelectOptions}
                                multi={true}
                                placeholder={(keywordsSelectOptions.length) ?'Choose keywords':'No keywords defined for the field'}
                                value={keywordsCurrentValue}
                                onChange={ (val) => this.onChangeKeyword(index, val)}
                                clearable={true}
                                backspaceRemoves={true}
                                disabled={isDisableEditing || !isFieldAvailable ||!keywordsSelectOptions.length}
                            />
                        </div>
                        <div className='btn-group'>
                            <button className='btn-link-default' disabled={minusDisabledClass}
                                    onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }
                                    type='button'>
                                <i className='md-i'>close</i></button>
                            <button className='btn-link-default' disabled={plusDisabledClass}
                                    onClick={ () => dispatch(viewBuilderAddColumn(index+1, nextDefaultField.id)) }
                                    type='button'>
                                <i className='md-i'>add</i></button>
                        </div>
                    </div>
                </div>
            );
        }.bind(this));

        return (

            <div className='copyview collapse in'>
                <h5 data-localize='views.setup.settings.title'>Table Columns</h5>
                <div className='row grid-toolbar hidden-xs'>

                    <div className='col-sm-6'>
                        <small className='text-muted text-order' data-localize='views.setup.settings.columns_order'>
                            Order
                        </small>
                        <small className='text-muted' data-localize='views.setup.settings.columns_sorting'>Column Name
                            and Multi Sort Order
                        </small>
                    </div>

                    <div className='col-sm-6'>
                        <small className='text-muted' data-localize='views.setup.settings.columns_filter'>Column Filter
                            and Keywords
                        </small>
                    </div>
                </div>

                {selects}
            </div>

        );
    }

    createCurrentKeywordValues(viewItem, keywords) {
        return [
            ...viewItem.keywords.map((keywordId) => {
                const currentKeyword = keywords[keywordId];
                return {value: currentKeyword.synonyms[0].keywordId, label: `${currentKeyword.synonyms[0].value}`};
            })
        ];
    }

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
                    return {value: keyword.synonyms[0].keywordId, label: `${keyword.synonyms[0].value}`};
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
                'btn-default',
                'btn-sort', sortDirection, {
                    'active': true
                }
            );
        }
    }

    renderSortButton(currentDirection, sortButtonClass, sortOrder, fieldId, isDisable) {
        return (
            <button className={sortButtonClass}
                    type='button'
                    disabled={isDisable}
                    onClick={ e => this.onSortClick(currentDirection, e.ctrlKey || e.metaKey, fieldId )}>
                <span className='badge badge-info'>{sortOrder}</span>
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
    };
}

export default connect(mapStateToProps)(ViewBuilder);
