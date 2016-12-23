import _ from 'lodash';
import React, {Component} from 'react';

import VariantsTableRow from './VariantsTableRow';

import {getNextPartOfData, selectTableRow} from '../../actions/variantsTable';
import {completeTableScrollPositionReset} from '../../actions/ui';

const REFS = {
    CONTAINER: 'variantsTableBody',
    LOADING: 'variantsTableLoading'
};

export default class VariantsTableRows extends Component {

    render() {
        const sampleRows = this.props.variants;
        const {sort} = this.props.variantsTable.searchInResultsParams;
        const {isFilteringOrSorting, selectedRowIndices} = this.props.variantsTable;
        const {fields, variantsHeader, variantsAnalysis} = this.props;

        return (
            <tbody className='table-variants-body'
                   id='variants_table_body'
                   ref={REFS.CONTAINER}>
            {this.renderTableBody(sampleRows, sort, isFilteringOrSorting,
                !!variantsAnalysis, variantsHeader, fields, selectedRowIndices)}
            {!isFilteringOrSorting && this.canLoadMore() && VariantsTableRows.renderLoadingItem()}
            </tbody>
        );
    }

    componentDidMount() {
        const containerElement = document.getElementsByClassName('table-variants-container').item(0);
        const scrollElement = this.refs[REFS.CONTAINER];
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
        const scrollElement = this.refs[REFS.CONTAINER];
        scrollElement.removeEventListener('scroll', this.handleScroll);
    }

    renderTableBody(rows, sortState, isFilteringOrSorting, variantsAnalysisPresent, variantsHeader, fields, selectedRowIndices) {
        if (isFilteringOrSorting || !variantsAnalysisPresent) {
            return VariantsTableRows.renderLoadingItem();
        } else {
            return _.map(rows,
                (row, index) =>
                    this.renderRow(row, index, sortState, variantsHeader, fields, selectedRowIndices)
            );
        }
    }

    handleScroll(e) {
        const {dispatch, ui: {shouldResetTableScrollPosition}, variantsTable: {isFetching, isNextDataLoading}} = this.props;
        // Workaround for bug #299
        if (shouldResetTableScrollPosition) {
            setTimeout(() => {
                this.refs[REFS.CONTAINER].scrollTop = 0;
                dispatch(completeTableScrollPositionReset());
            }, 10);
        }

        if (this.canLoadMore() && !isNextDataLoading && !isFetching) {
            const containerElement = this.refs[REFS.CONTAINER];
            const loadingElement = this.refs[REFS.LOADING];
            // check visibility of the 'loading' element
            if (loadingElement && loadingElement.offsetTop < containerElement.scrollTop + containerElement.clientHeight) {
                dispatch(getNextPartOfData());
            }
        }

        const el = e.target;
        if (this.props.xScrollListener) {
            this.props.xScrollListener(el.scrollLeft);
        }
    }

    // checks if the last results size (currentVariants.length) is greater or equal to the limit of single request
    canLoadMore() {
        const {ws: {currentVariants}, variantsTable: {searchInResultsParams: {limit}}} = this.props;
        return currentVariants && currentVariants.length >= limit;
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
                              tableElement={this}
                              onSelected={
                                (rowIndex, isNowSelected) => this.onTableRowSelected(rowIndex, isNowSelected)
                              }
            />
        );
    }

    static renderLoadingItem() {
        return (
            <tr ref={REFS.LOADING}>
                <td colSpan='100'>
                    <div className='table-loader'>Loading...<i className='md-i'>autorenew</i>
                    </div>
                </td>
            </tr>
        );
    }

    onTableRowSelected(rowIndex, isNowSelected) {
        const {dispatch} = this.props;
        dispatch(selectTableRow(rowIndex, isNowSelected));
    }
}
