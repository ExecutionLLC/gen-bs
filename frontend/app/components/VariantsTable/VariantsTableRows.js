import _ from 'lodash';
import React, {Component} from 'react';

import VariantsTableRow from './VariantsTableRow';

import {getNextPartOfData, selectTableRow} from '../../actions/variantsTable';
import {completeTableScrollPositionReset} from '../../actions/ui';

export default class VariantsTableRows extends Component {

    render() {
        const sampleRows = this.props.variants;
        const {currentVariants} = this.props.ws;
        const {sort} = this.props.variantsTable.searchInResultsParams;
        const {isFilteringOrSorting, selectedRowIndices} = this.props.variantsTable;
        const {fields, variantsHeader} = this.props;
        const currentView = this.props.ws.variantsView;

        return (
            <tbody className='table-variants-body'
                   id='variants_table_body'
                   ref='variantsTableBody'>
            {this.renderTableBody(sampleRows, sort, isFilteringOrSorting,
                currentView, variantsHeader, fields, selectedRowIndices)}
            {this.renderWaitingIfNeeded(isFilteringOrSorting, currentVariants)}
            </tbody>
        );
    }

    componentDidMount() {
        const containerElement = document.getElementsByClassName('table-variants-container').item(0);
        const scrollElement = this.refs.variantsTableBody;
        console.log('scrollElement', scrollElement);
        console.log('containerElement', containerElement.clientHeight);
        scrollElement.style.height = `${containerElement.clientHeight - 100}px`;

        scrollElement.addEventListener('scroll', this.handleScroll.bind(this));
    }

    shouldComponentUpdate(nextProps) {
        return this.props.variants !== nextProps.variants
            || this.props.variantsTable.isFilteringOrSorting !== nextProps.variantsTable.isFilteringOrSorting
            || this.props.variantsTable.selectedRowIndices !==
            nextProps.variantsTable.selectedRowIndices;
    }

    componentWillUnmount() {
        const scrollElement = this.refs.variantsTableBody;
        scrollElement.removeEventListener('scroll', this.handleScroll);
    }

    componentDidUpdate() {
        if (this.props.onRendered) {
            this.props.onRendered();
        }
    }

    renderTableBody(rows, sortState, isFilteringOrSorting, currentView, variantsHeader, fields, selectedRowIndices) {
        if (isFilteringOrSorting || !currentView) {
            return (
                <tr>
                    <td colSpan='100'>
                        <div className='table-loader'>Loading...<i className='md-i'>autorenew</i>
                        </div>
                    </td>
                </tr>
            );
        } else {
            return _.map(rows,
                (row, index) =>
                    this.renderRow(row, index, sortState, variantsHeader, fields, selectedRowIndices)
            );
        }
    }

    handleScroll(e) {
        const {dispatch, ws: {currentVariants}, ui: {shouldResetTableScrollPosition}} = this.props;
        // Workaround for bug #299
        if (shouldResetTableScrollPosition) {
            setTimeout(() => {
                this.refs.variantsTableBody.scrollTop = 0;
                dispatch(completeTableScrollPositionReset());
            }, 10);
        }
        if (!currentVariants) {
            return;
        }
        const el = e.target;
        const variantsLength = currentVariants.length;

        if (el.scrollHeight - el.scrollTop === el.clientHeight
            && variantsLength > this.props.variantsTable.searchInResultsParams.limit - 1) {
            this.props.dispatch(getNextPartOfData());
        }

        if (this.props.xScrollListener) {
            this.props.xScrollListener(el.scrollLeft);
        }
    }

    renderRow(row, rowIndex, sortState, variantsHeader, fields, selectedRowIndices) {
        const isSelected = _.includes(selectedRowIndices, rowIndex);
        return (
            <VariantsTableRow key={rowIndex}
                              row={row}
                              rowIndex={rowIndex}
                              sortState={sortState}
                              variantsHeader={variantsHeader}
                              isSelected={isSelected}
                              fields={fields}
                              auth={this.props.auth}
                              dispatch={this.props.dispatch}
                              onSelected={
                                (rowIndex, isNowSelected) => this.onTableRowSelected(rowIndex, isNowSelected)
                              }
            />
        );
    }

    renderWaitingIfNeeded(isFilteringOrSorting, currentVariants) {
        const variantsLength = (!currentVariants) ? 0 : currentVariants.length;
        if (!isFilteringOrSorting && variantsLength > 99) {
            return (
                <tr>
                    <td colSpan='100'>
                        <div className='table-loader'>Loading...<i className='md-i'>autorenew</i>
                        </div>
                    </td>
                </tr>
            );
        } else {
            return null;
        }
    }

    onTableRowSelected(rowIndex, isNowSelected) {
        const {dispatch} = this.props;
        dispatch(selectTableRow(rowIndex, isNowSelected));

        const str = isNowSelected ? 'selected' : 'unselected';
        console.log(`Row ${rowIndex} is ${str}`);
    }
}
