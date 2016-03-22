import React from 'react';
import classNames from 'classnames';

import ComponentBase from '../shared/ComponentBase';


export default class VariantsTableRow extends ComponentBase {
    render() {
        const {row, rowIndex, currentView, sortState} = this.props;
        const rowFields = row.fields;
        const comments = row.comments;
        const viewFields = currentView.view_list_items;

        return (
            <tr>
                <td className="btntd row_checkbox"
                    key="row_checkbox">
                    <div><label className="checkbox hidden">
                        <input type="checkbox"/>
                        <i></i>
                    </label>
                        <span>{rowIndex + 1}</span>
                    </div>
                </td>
                <td className="btntd">
                    <div>
                        <button data-toggle="button"
                                className="btn btn-link reset-padding">
                            <i className="i-star"></i>
                        </button>
                    </div>
                </td>
                <td className="comment"
                    key="comment">
                    <div><a href="#" className="btn-link-default comment-link" data-type="textarea" data-pk="1"
                            data-placeholder="Your comments here..." data-placement="right">{comments}</a></div>
                </td>
                {_.map(viewFields, (field) => this.renderFieldValue(field, sortState, rowFields))}
            </tr>
        );
    }

    renderFieldValue(field, sortState, rowFields) {
        const fieldId = field.field_id;
        const resultField = _.find(rowFields, rowField => rowField.field_id === fieldId);
        let columnSortParams = _.find(sortState, sortItem => sortItem.field_id === fieldId);

        let sortedActiveClass = classNames({
            'active': columnSortParams
        });

        return (
            <td className={sortedActiveClass}
                key={fieldId}>
                <div>
                    {(resultField === null) ? '' : resultField.value}
                </div>
            </td>
        );
    }
}

VariantsTableRow.propTypes = {
    row: React.PropTypes.object.isRequired,
    rowIndex: React.PropTypes.number.isRequired,
    currentView: React.PropTypes.object.isRequired,
    sortState: React.PropTypes.array.isRequired
};
