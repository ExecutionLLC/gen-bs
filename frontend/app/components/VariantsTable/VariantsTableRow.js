import React from 'react';
import classNames from 'classnames';

import ComponentBase from '../shared/ComponentBase';

import VariantsTableComment from './VariantsTableComment';


export default class VariantsTableRow extends ComponentBase {
    render() {
        const {row, auth, rowIndex, currentView, sortState, fields} = this.props;
        const rowFieldsHash = row.fieldsHash;
        const rowFields = row.fields;
        const comments = row.comments;
        const viewFields = currentView.view_list_items;

        const pos = this.getMainFieldValue('POS', rowFields, fields);
        const alt = this.getMainFieldValue('ALT', rowFields, fields);
        const chrom = this.getMainFieldValue('CHROM', rowFields, fields);
        const ref = this.getMainFieldValue('REF', rowFields, fields);
        const searchKey = row.search_key;

        return (
            <tr>
                <td className="btntd row_checkbox"
                    key="row_checkbox">
                    <div>
                        <label className="checkbox">
                            <input type="checkbox"/>
                            <i/>
                        </label>
                        <span>{rowIndex + 1}</span>
                    </div>
                </td>
                <td className="btntd">
                    <div>
                        <button data-toggle="button"
                                className="btn btn-link reset-padding">
                            <i className="i-star"/>
                        </button>
                    </div>
                </td>
                <VariantsTableComment alt={alt}
                                      pos={pos}
                                      reference={ref}
                                      chrom={chrom}
                                      searchKey={searchKey}
                                      dispatch={this.props.dispatch}
                                      auth={auth}
                                      comments={comments}
                />
                {_.map(viewFields, (field) => this.renderFieldValue(field, sortState, rowFieldsHash))}
            </tr>
        );
    }

    getMainFieldValue(col_name, row_fields, fields) {
        const mainField = _.find(fields.totalFieldsList, field => field.name === col_name);
        return _.find(row_fields, field => field.field_id === mainField.id).value
    }


    renderFieldValue(field, sortState, rowFields) {
        const fieldId = field.field_id;
        const resultFieldValue = rowFields[fieldId];
        let columnSortParams = _.find(sortState, sortItem => sortItem.field_id === fieldId);

        let sortedActiveClass = classNames({
            'active': columnSortParams
        });

        return (
            <td className={sortedActiveClass}
                key={fieldId}>
                <div>
                    {resultFieldValue || ''}
                </div>
            </td>
        );
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.row !== nextProps.row;
    }
}

VariantsTableRow.propTypes = {
    row: React.PropTypes.object.isRequired,
    rowIndex: React.PropTypes.number.isRequired,
    currentView: React.PropTypes.object.isRequired,
    sortState: React.PropTypes.array.isRequired
};
