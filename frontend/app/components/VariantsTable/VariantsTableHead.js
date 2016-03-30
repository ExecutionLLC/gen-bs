import React, { Component } from 'react';
import classNames from 'classnames';

import FieldHeader from './FieldHeader';
import  { firstCharToUpperCase } from '../../utils/stringUtils';
import FieldUtils from '../../utils/fieldUtils';

import { changeVariantsFilter, sortVariants, searchInResultsSortFilter } from '../../actions/variantsTable';

export default class VariantsTableHead extends Component {

    render() {
        const { dispatch, fields, ws, searchParams } = this.props;
        const { sort } = this.props.variantsTable.searchInResultsParams;
        if(!searchParams){
            return (
                <tbody className="variants_table_head" id="variants_table_head">
                <tr />
                </tbody>
            );
        }

        const currentView = ws.variantsView;
        if (!currentView) {
            return (
                <tbody className="table-variants-head" id="variants_table_head">
                <tr />
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
                    <div className="variants-table-search-field input-group invisible">
                       <span className="input-group-btn">
                           <button className="btn btn-link-light-default">
                               <i className="md-i">search</i>
                           </button>
                       </span>
                        <input type="text" className="form-control material-input"
                               value=""
                        />
                    </div>
                </td>
                {_.map(fieldIds, (fieldId) => this.renderFieldHeader(fieldId, fields, sort, dispatch))}
            </tr>
            </tbody>
        );
    }

    renderFieldHeader(fieldId, fields, sortState, dispatch) {
        const sendSortRequestedAction = (fieldId, direction, isControlKeyPressed) =>
            dispatch(sortVariants(fieldId, direction, isControlKeyPressed));
        const sendSearchRequest = (fieldId, searchValue) => {
            dispatch(changeVariantsFilter(fieldId, searchValue));
            dispatch(searchInResultsSortFilter());
        };
        const onSearchValueChanged = (fieldId, searchValue) => dispatch(changeVariantsFilter(fieldId, searchValue));
        return (
            <FieldHeader key={fieldId}
                         fieldId={fieldId}
                         fields={fields}
                         sortState={sortState}
                         onSortRequested={sendSortRequestedAction}
                         onSearchRequested={sendSearchRequest}
                         onSearchValueChanged={onSearchValueChanged}
                         currentVariants = {this.props.ws.currentVariants}
            />
        );
    }
}
