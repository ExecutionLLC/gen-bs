import React, { Component } from 'react';
import {OverlayTrigger,Popover,Button} from 'react-bootstrap'
import classNames from 'classnames';

import VariantsTableEmpty from './VariantsTableEmpty';
import VariantsTableRow from './VariantsTableRow';

import { getNextPartOfData, createComment } from '../../actions/variantsTable';

export default class VariantsTableRows extends Component {

    render() {
        const sampleRows = this.props.variants;
        const { currentVariants } = this.props.ws;
        const { sort } = this.props.variantsTable.searchInResultsParams;
        const { isFilteringOrSorting} = this.props.variantsTable;
        const { searchParams,ui,fields } = this.props;
        const currentView = this.props.ws.variantsView;

        return (
            <tbody className="table-variants-body"
                   id="variants_table_body"
                   ref="variantsTableBody">
            {this.renderTableBody(sampleRows, sort, isFilteringOrSorting, currentView,fields)}
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

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.variants !== nextProps.variants
            || this.props.variantsTable.isFilteringOrSorting !== nextProps.variantsTable.isFilteringOrSorting;
    }

    componentWillUnmount() {
        const scrollElement = this.refs.variantsTableBody;
        scrollElement.removeEventListener('scroll', this.handleScroll);
    }

    renderTableBody(rows, sortState, isFilteringOrSorting, currentView,fields) {
        if (isFilteringOrSorting || !currentView) {
            return (
                <tr>
                    <td colSpan="100">
                        <div className="table-loader">Loading...<i className="md-i">autorenew</i>
                        </div>
                    </td>
                </tr>
            );
        } else {
            return _.map(rows, (row, index) => this.renderRow(row, index, sortState, currentView,fields));
        }
    }

    handleScroll(e) {
        const { currentVariants } = this.props.ws;
        if (!currentVariants) {
            return;
        }
        const el = e.target;
        const variantsLength = currentVariants.length;

        if (el.scrollHeight - el.scrollTop === el.clientHeight
            && variantsLength > this.props.variantsTable.searchInResultsParams.limit - 1) {
            this.props.dispatch(getNextPartOfData());
        }

        if(this.props.xScrollListener) {
            this.props.xScrollListener(el.scrollLeft);
        }
    }

    renderRow(row, rowIndex, sortState, currentView,fields) {
        return (
            <VariantsTableRow key={rowIndex}
                              row={row}
                              rowIndex={rowIndex}
                              sortState={sortState}
                              currentView={currentView}
                              fields={fields}
                              auth = {this.props.auth}
                              dispatch = {this.props.dispatch}
            />
        );
    }

    renderWaitingIfNeeded(isFilteringOrSorting, currentVariants) {
        const variantsLength = (!currentVariants) ? 0 : currentVariants.length;
        if (!isFilteringOrSorting && variantsLength > 99) {
            return (
                <tr>
                    <td colSpan="100">
                        <div className="table-loader">Loading...<i className="md-i">autorenew</i>
                        </div>
                    </td>
                </tr>
            );
        } else {
            return null;
        }
    }
}
