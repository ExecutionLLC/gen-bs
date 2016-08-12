import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';

import ComponentBase from '../shared/ComponentBase';

import VariantsTableComment from './VariantsTableComment';


export default class VariantsTableRow extends ComponentBase {
    render() {
        const {
            row,
            auth,
            rowIndex,
            currentView: {viewListItems},
            sortState,
            fields,
            isSelected
        } = this.props;
        const rowFieldsHash = row.fieldsHash;
        const rowFields = row.fields;
        const comments = row.comments;

        const pos = this.getFieldValue('POS', rowFieldsHash, fields);
        const alt = this.getFieldValue('ALT', rowFieldsHash, fields);
        const chrom = this.getFieldValue('CHROM', rowFieldsHash, fields);
        const ref = this.getFieldValue('REF', rowFieldsHash, fields);
        const searchKey = row.searchKey;

        return (
            <tr>
                <td className='btntd row_checkbox'>
                    <div>{rowIndex + 1}</div>
                </td>
                <td className='btntd row_checkbox'
                    key='row_checkbox'>
                    <div>
                        <label className='checkbox'>
                            <input type='checkbox'
                                   checked={isSelected}
                                   onChange={() => this.onRowSelectionChanged()}
                            />
                            <i/>
                        </label>
                        <span />
                    </div>
                </td>
                <td className='btntd'>
                    <div>
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
                {this.renderFieldCells(viewListItems, sortState, rowFieldsHash, fields)}
            </tr>
        );
    }

    renderFieldCells(viewListItems, sortState, rowFieldsHash, fields) {
        return viewListItems.map(({fieldId}) => {
            const field = fields.totalFieldsHash[fieldId];
            const fieldValue =  rowFieldsHash[fieldId];
            const fieldSortState = _.find(sortState, sortItem => sortItem.fieldId === fieldId);
            return this.renderFieldCell(field, fieldSortState, fieldValue);
        });
    }

    onRowSelectionChanged() {
        const {onSelected, rowIndex, isSelected} = this.props;
        onSelected(rowIndex, !isSelected);
    }

    getFieldValue(colName, rowFieldsHash, fields) {
        const field = _.find(fields.totalFieldsList, field => field.name === colName);
        return rowFieldsHash[field.id].value;
    }


    renderFieldCell(field, fieldSortState, fieldValue) {
        const sortedActiveClass = classNames({
            'active': fieldSortState
        });

        return (
            <td className={sortedActiveClass}
                key={field.id}>
                <div>
                    {fieldValue || ''}
                </div>
            </td>
        );
    }

    shouldComponentUpdate(nextProps) {
        return this.props.row !== nextProps.row
            || this.props.isSelected !== nextProps.isSelected;
    }
}

VariantsTableRow.propTypes = {
    row: React.PropTypes.object.isRequired,
    rowIndex: React.PropTypes.number.isRequired,
    currentView: React.PropTypes.object.isRequired,
    sortState: React.PropTypes.array.isRequired,
    auth: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    isSelected: React.PropTypes.bool.isRequired,
    // callback(rowIndex, isSelected)
    onSelected: React.PropTypes.func.isRequired
};
