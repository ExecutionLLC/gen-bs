import React, { Component } from 'react';
import classNames from 'classnames';

import  { firstCharToUpperCase } from '../../utils/stringUtils'

import { changeVariantsFilter, sortVariants, searchInResultsSortFilter } from '../../actions/variantsTable'

export default class VariantsTableHead extends Component {

    render() {
        const { dispatch, variants, fields, ui,searchParams } = this.props;
        const { sort } = this.props.variantsTable.searchInResultsParams;
        if(!searchParams){
            return (
                <tbody className="variants_table_head" id="variants_table_head">
                <tr></tr>
                </tbody>
            );
        }

        const currentView = _.find(ui.views,view => view.id===searchParams.viewId) ;
        if (!currentView) {
            return (
                <tbody className="table-variants-head" id="variants_table_head">
                <tr></tr>
                </tbody>
            );
        }

        const fieldIds = _.map(currentView.view_list_items, item => item.field_id);

        return (
            <tbody className="table-variants-head" id="variants_table_head">
            <tr>
                <td className="btntd row_checkbox" data-label="checkbox" key="row_checkbox">
                    <div></div>
                </td>
                <td className="btntd">
                    <div></div>
                </td>
                <td data-label="comment" key="comment" className="comment">
                    <div>
                        <div className="variants-table-header-label">
                            <a type="button" className="btn-link-default">
                                Comment
                            </a>
                            
                        </div>
                    </div>
                    <div className="variants-table-search-field input-group">
                       <span className="input-group-btn"><button className="btn btn-link-light-default"><i className="md-i">search</i></button></span>
                        <input type="text" className="form-control material-input"
                               value=""
                        />
                    </div>
                </td>
                {_.map(fieldIds, (fieldId) => this.renderFieldHeader(fieldId, fields, variants, sort, dispatch))}
            </tr>
            </tbody>
        );
    }

    renderFieldHeader(fieldId, fields, variants, sortState, dispatch) {
        const columnSortParams = sortState ? _.find(sortState, sortItem => sortItem.field_id === fieldId)
            : null;
        if (columnSortParams) {
            console.log('columnSortParams', columnSortParams)
        }

        const sortClassAsc = classNames(
            'btn', 'btn-sort', 'asc', {
                'active': columnSortParams && columnSortParams.direction === 'asc'
            });
        const sortClassDesc = classNames(
            'btn', 'btn-sort', 'desc',
            {
                'active': columnSortParams && columnSortParams.direction === 'desc'
            });

        const fieldMetadata = this.findFieldMetadata(fieldId, fields);

        const name = firstCharToUpperCase(
            !fieldMetadata ? 'Unknown' : fieldMetadata.name
        );

        return (
            <td data-label={fieldId} key={fieldId}>
                <div>
                    <div className="variants-table-header-label">
                        <a type="button" className="btn-link-default">
                            {name}
                        </a>


                        <div className="btn-group btn-group-sort" role="group" data-toggle="buttons">
                            <button className={sortClassAsc}
                                    onClick={ e => dispatch(sortVariants(fieldId, 'asc', e.ctrlKey || e.metaKey)) }>
                                {columnSortParams && columnSortParams.direction === 'asc' &&
                                <span className="text-info">{columnSortParams.order}</span>
                                }
                            </button>
                            <button className={sortClassDesc}
                                    onClick={ e => dispatch(sortVariants(fieldId, 'desc', e.ctrlKey || e.metaKey)) }>
                                {columnSortParams && columnSortParams.direction === 'desc' &&
                                <span className="text-info">{columnSortParams.order}</span>
                                }
                            </button>
                        </div>
                    </div>
                </div>
                {this.renderFilterInputs(fieldId, fields, variants, dispatch)}
            </td>
        );
    }

    renderFilterInputs(fieldId, fields, variants, dispatch) {
        const fieldMetadata = this.findFieldMetadata(fieldId, fields);
        const fieldValueType = (fieldMetadata) ? fieldMetadata.value_type : null;

        if (fieldValueType === 'string') {
            var searchObj = _.find([...this.props.variantsTable.searchInResultsParams.search], {field_id: fieldId});
            var inputValue = searchObj ? searchObj.value : '';
            return (
                <div className="variants-table-search-field input-group">
                    <span className="input-group-btn"><button className="btn btn-link-light-default"><i className="md-i">search</i></button></span>
                    <input type="text" className="form-control material-input"
                           value={inputValue}
                           onChange={(e) => dispatch(changeVariantsFilter(variants, fieldId, e.target.value))}
                           onKeyPress={(e) => e.charCode === 13 ? dispatch( searchInResultsSortFilter() ): null }
                    />
                </div>
            )
        } else {
            return (
                <div className="variants-table-search-field input-group">
                    <span className="input-group-btn"><button className="btn btn-link-light-default"><i className="md-i">search</i></button></span>
                    <input type="text" className="form-control material-input"
                           value="Non-filtered type"
                           disabled
                    />
                </div>
            )
        }
    }

    findFieldMetadata(fieldId, fields) {
        return _.find(fields.list, (field) => field.id === fieldId) ||
            _.find(fields.sourceFieldsList, (field) => field.id === fieldId);
    }
}
