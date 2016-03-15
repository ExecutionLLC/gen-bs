import React, { Component } from 'react';
import classNames from 'classnames';

import { getNextPartOfData } from '../../actions/variantsTable'

export default class VariantsTableRows extends Component {

  render() {
    const sampleRows = this.props.variants;
    const { currentVariants } = this.props.ws;
    const { sort } = this.props.variantsTable.searchInResultsParams;
    const { isFilteringOrSorting} = this.props.variantsTable;

    return (
        <tbody className="table-variants-body"
               id="variants_table_body"
               ref="variantsTableBody">
        {this.renderTableBody(sampleRows, sort, isFilteringOrSorting)}
        {this.renderWaitingIfNeeded(isFilteringOrSorting, currentVariants)}
        </tbody>
    );
  }

  componentDidMount() {
    const containerElement = document.getElementsByClassName('table-variants-container').item(0);
    const scrollElement = this.refs.variantsTableBody;
    console.log('scrollElement', scrollElement );
    console.log('containerElement', containerElement.clientHeight );
    scrollElement.style.height = `${containerElement.clientHeight - 100}px`;

    scrollElement.addEventListener('scroll', this.handleScroll.bind(this));
  }

  componentWillUnmount() {
    const scrollElement = this.refs.variantsTableBody;
    scrollElement.removeEventListener('scroll', this.handleScroll);
  }

  renderTableBody(rows, sortState, isFilteringOrSorting) {
    if (isFilteringOrSorting) {
      return (
          <h2 className="text-center" style={{color: '#2363a1'}}>Loading...<i className="text-center fa fa-spinner fa-spin fa-5x"></i>
          </h2>
      );
    } else {
      return _.map(rows, (row, index) => this.renderRow(row, index, sortState));
    }
  }

  handleScroll(e) {
    //console.log('scroll', e);
    const el = e.target;
    const { currentVariants } = this.props.ws;
    const variantsLength = (currentVariants === null) ? 0 : currentVariants.length;

    if (el.scrollHeight - el.scrollTop === el.clientHeight && currentVariants && variantsLength > 99) {
      this.props.dispatch(getNextPartOfData()) 
    }
  }

  renderRow(row, rowIndex, sortState) {
    const rowFields = row.fields;
    const comments = row.comments;

    return (
        <tr key={rowIndex}>
          <td className="row_checkbox"
              key="row_checkbox">
            <label className="checkbox">
              <input type="checkbox" />
              <i></i>
            </label>
            <span>{rowIndex + 1}</span>
            <button data-toggle="button"
                    className="btn btn-link">
              <i className="i-star"></i>
            </button>
          </td>
          <td className="comment"
              key="comment">
            {comments}
          </td>
          {_.map(rowFields, (field) => this.renderFieldValue(field, sortState))}
        </tr>
    );
  }

  renderFieldValue(field, sortState) {
    const fieldId = field.field_id;
    let columnSortParams = _.find(sortState, sortItem => sortItem.field_id === fieldId);

    let sortedActiveClass = classNames({
      'active': columnSortParams
    });

    return (
        <td className={sortedActiveClass}
            key={fieldId}>
          {field.value}
        </td>
    );
  }

  renderWaitingIfNeeded(isFilteringOrSorting, currentVariants) {
    const variantsLength = (currentVariants === null) ? 0 : currentVariants.length;
    if (!isFilteringOrSorting && variantsLength > 99) {
      return (
        <tr>
          <td colSpan="100">
            <h2 className="text-center" style={{color: '#2363a1'}}>Loading...<i className="text-center fa fa-spinner fa-spin fa-3x"></i>
            </h2>
          </td>
        </tr>
      );
    } else {
      return null;
    }
  }
}
