import React, { Component } from 'react';
import  { firstCharToUpperCase } from '../../utils/stringUtils'

export default class VariantsTableHead extends Component {

  render() {
    let variantsColumns = null;
    let head = [];

    if (!this.props.variants) {
      head = null;
    } else {
      variantsColumns = Object.keys(this.props.variants[0]);
      head.push(<th data-label="checkbox" key="row_checkbox"></th>);

      head.push(
          <th data-label="comment" key="comment">
            <div><span className="variants-table-header-label">
              Comment<button className="btn btn-link btnSort"></button>
            </span></div>
            <div><input type="text" className="form-control" /></div>
          </th>
      )
      variantsColumns.filter( (label) => label !== 'comment' ).map( (label) => {
          head.push(
              <th data-label={label} key={label} > 
                <div><span className="variants-table-header-label">
                  { firstCharToUpperCase(label) }<button className="btn btn-link btnSort"></button>
                </span></div>
                <div><input type="text" className="form-control" /></div>
              </th>
          )
      });

    }

    return (
      <thead id="variants_table_head"><tr>{head}</tr></thead>
    )
  }
}
