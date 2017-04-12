import _ from 'lodash';
import React, {Component, PropTypes} from 'react';

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
            <tbody
                className='table-variants-body'
                id='variants_table_body'
                ref={REFS.CONTAINER}
            >
                {this.renderTableBody(
                    sampleRows, sort, isFilteringOrSorting,
                    !!variantsAnalysis, variantsHeader, fields, selectedRowIndices
                )}
                {!isFilteringOrSorting && this.canLoadMore() && this.renderLoadingItem()}
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
            || this.props.variantsTable.selectedRowIndices !== nextProps.variantsTable.selectedRowIndices
            || this.props.p !== nextProps.p;
    }

    componentWillUnmount() {
        const scrollElement = this.refs[REFS.CONTAINER];
        scrollElement.removeEventListener('scroll', this.handleScroll);
    }

    renderTableBody(rows, sortState, isFilteringOrSorting, variantsAnalysisPresent, variantsHeader, fields, selectedRowIndices) {
        if (isFilteringOrSorting || !variantsAnalysisPresent) {
            return this.renderTempRow();
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
        const {websocket: {currentVariants}, variantsTable: {searchInResultsParams: {limit}}} = this.props;
        return currentVariants && currentVariants.length >= limit;
    }

    renderRow(row, rowIndex, sortState, variantsHeader, fields, selectedRowIndices) {
        const isSelected = _.includes(selectedRowIndices, rowIndex);
        return (
            <VariantsTableRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                sortState={sortState}
                variantsHeader={variantsHeader}
                isSelected={isSelected}
                fields={fields}
                auth={this.props.auth}
                ui={this.props.ui}
                dispatch={this.props.dispatch}
                tableElement={this}
                onSelected={
                    (rowIndex, isNowSelected) => this.onTableRowSelected(rowIndex, isNowSelected)
                }
                p={this.props.p}
            />
        );
    }

    renderTempRow() {
        const {variantsHeader} = this.props;
        return [
            this.renderLoadingItem(),
            <tr key='temp-row-tr' style={{visibility: 'hidden'}}>
                <td className='btntd row_checkbox'>
                    <div>{1}</div>
                </td>
                <td className='btntd row_checkbox'
                    key='row_checkbox'
                >
                    <div>
                        <label className='checkbox'>
                            <input type='checkbox'/>
                            <i/>
                        </label>
                        <span />
                    </div>
                </td>
                <td className='btntd'>
                    <div>
                    </div>
                </td>
                <td className='comment'>
                    <div>
                    </div>
                </td>
                {_.map(variantsHeader, (variantsHeader) => {
                    return (
                        <td key={`${variantsHeader.fieldId}-${variantsHeader.sampleId}`}>
                            <div>
                            </div>
                        </td>
                    );
                })}
            </tr>
        ];
    }

    renderLoadingItem() {
        const {p} = this.props;

        return (
            <tr key='loading-table-row' ref={REFS.LOADING}>
                <td colSpan='100'>
                    <div className='table-loader'>{p.t('variantsTable.loading')}<i className='md-i'>autorenew</i>
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

VariantsTableRows.propTypes = {
    ui: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    fields: PropTypes.object.isRequired,
    variants: PropTypes.array,
    variantsHeader: PropTypes.array,
    variantsAnalysis: PropTypes.object,
    websocket: PropTypes.object.isRequired,
    variantsTable: PropTypes.object.isRequired,
    xScrollListener: PropTypes.func.isRequired,
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired,
    dispatch: PropTypes.func.isRequired
};