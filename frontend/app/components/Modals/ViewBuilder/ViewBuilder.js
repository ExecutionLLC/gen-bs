import React from 'react';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import _ from 'lodash';

import Select from '../../shared/Select';
import {
    viewBuilderDeleteColumn,
    viewBuilderAddColumn,
    viewBuilderChangeColumn,
    viewBuilderChangeSortColumn,
    viewBuilderChangeKeywords
} from '../../../actions/viewBuilder';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import FieldUtils from '../../../utils/fieldUtils';
import * as i18n from '../../../utils/i18n';


export default class ViewBuilder extends React.Component {

    shouldComponentUpdate(nextProps) {
        return this.props.fields !== nextProps.fields
            || this.props.viewBuilder.editingView.type !== nextProps.viewBuilder.editingView.type
            || this.props.viewBuilder.editingView.viewListItems !== nextProps.viewBuilder.editingView.viewListItems;
    }

    render() {
        const {dispatch, fields, viewBuilder, ui: {languageId}} = this.props;
        const allAvailableFields = viewBuilder.allowedFields;
        const view = viewBuilder.editingView;
        const viewItemsLength = view.viewListItems.length;
        const previouslySelectedFieldIds = view.viewListItems.map(viewItem => viewItem.fieldId);
        // Exclude fields that are already selected.
        const fieldsForSelection = _.filter(
            allAvailableFields,
            field => !_.includes(previouslySelectedFieldIds, field.id)
        );
        // This field will be chosen when a new item is created.
        const nextDefaultField = _.first(fieldsForSelection);
        const isDisableEditing = !entityTypeIsEditable(view.type);
        const plusDisabled = isDisableEditing || viewItemsLength >= 30 || !nextDefaultField;
        const minusDisabled = isDisableEditing || viewItemsLength <= 1;

        const selects = view.viewListItems.map(function (viewItem, index) {

            const currentField = fields.totalFieldsHashedArray.hash[viewItem.fieldId];
            const currentValue = currentField ? Object.assign({}, currentField, {
                label: FieldUtils.makeFieldViewsCaption(currentField, languageId)
            }): {id: null};

            const isFieldAvailable = _.some(allAvailableFields, {id: viewItem.fieldId}) || currentValue.id == null;
            const selectOptions = fieldsForSelection.map((f) => {
                return {value: f.id, label: FieldUtils.makeFieldViewsCaption(f, languageId)};
            });
            const {sortOrder, sortDirection, fieldId} = viewItem;
            const ascSortBtnClasses = this.getSortButtonClasses(sortOrder, sortDirection);

            //keywords
            const currentValueKeywordsHash = this.createFieldKeywordsHash(currentValue);
            const keywordsCurrentValue = this.createCurrentKeywordValues(viewItem, currentValueKeywordsHash, languageId);
            const keywordsSelectOptions = this.createFieldKeywordsSelectOptions(currentValue, languageId);

            return (

                <div className='form-group' key={Math.round(Math.random()*100000000).toString()}>

                    <div className='col-xs-12 col-sm-6 btn-group-select-group'>
                        <div className='btn-group btn-group-select-group-max'>
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
                    <div className='col-xs-12 col-sm-6 btn-group-select-group'>
                        <div className='btn-group btn-group-select-group-max'>
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
                            <button className='btn-link-default' disabled={minusDisabled}
                                    onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }
                                    type='button'>
                                <i className='md-i'>close</i></button>
                            <button className='btn-link-default' disabled={plusDisabled}
                                    onClick={ () => dispatch(viewBuilderAddColumn(index+1, nextDefaultField.id)) }
                                    type='button'>
                                <i className='md-i'>add</i></button>
                        </div>
                    </div>
                </div>
            );
        }.bind(this));

        return (

            <div className='form-rows'>
                <h5 data-localize='views.setup.settings.title'>Table Columns</h5>
                <div className='form-group hidden-xs'>

                    <div className='col-sm-6'>
                       
                        <small className='text-muted' data-localize='views.setup.settings.columns_sorting'>Column Name
                            and Sort Order
                        </small>
                    </div>

                    <div className='col-sm-6'>
                        <small className='text-muted' data-localize='views.setup.settings.columns_filter'>
                           Keywords
                        </small>
                    </div>
                </div>

                {selects}
            </div>

        );
    }

    createCurrentKeywordValues(viewItem, keywords, languageId) {
        return [
            ...viewItem.keywords.map((keywordId) => {
                const currentKeyword = keywords[keywordId];
                const synonymText = i18n.getEntityText(currentKeyword, languageId);
                return {value: synonymText.keywordId, label: `${synonymText.value}`};
            })
        ];
    }

    createFieldKeywordsHash(field) {
        if (!field.id) {
            return {};
        } else {
            return _.keyBy(field.keywords, (keyword) => keyword.id);
        }
    }

    createFieldKeywordsSelectOptions(field, languageId) {
        if (!field.id) {
            return [];
        } else {
            return [
                ...field.keywords.map((keyword) => {
                    const synonymText = i18n.getEntityText(keyword, languageId);
                    return {value: synonymText.keywordId, label: `${synonymText.value}`};
                })
            ];
        }
    }

    getSortButtonClasses(order, sortDirection) {
        if (!order && !sortDirection) {
            return classNames(
                'btn',
                'btn-sort',
                'btn-link-default'
            );
        }
        else {
            return classNames(
                'btn',
                'btn-link-default',
                'btn-sort',
                sortDirection,
                {
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
                <span className='text-info'>{sortOrder}</span>
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
