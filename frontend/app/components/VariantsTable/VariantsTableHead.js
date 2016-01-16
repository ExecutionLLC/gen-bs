import React, { Component } from 'react';
import  { firstCharToUpperCase } from '../../utils/stringUtils'

export default class VariantsTableHead extends Component {

  render() {
    const { variants, fields } = this.props
    let variantsColumns = null;
    let head = [];


    const filterFunc = (label) => {
      return (
        (label !== 'comment')
        && (label !== 'search_key')
      )
    }


    if (!variants) {
      head = null;
    } else {
      variantsColumns = Object.keys(variants[0]);
      head.push(<th data-label="checkbox" key="row_checkbox"></th>);

      head.push(
          <th data-label="comment" key="comment">
            <div><span className="variants-table-header-label">
              Comment<button className="btn btn-link btnSort"></button>
            </span></div>
            <div><input type="text" className="form-control" /></div>
          </th>
      )
      variantsColumns.filter( filterFunc ).map( (label) => {
          let name = '';
          name = _.find(fields, (field) => field.id === label).name
          
          head.push(
              <th data-label={label} key={label} > 
                <div><span className="variants-table-header-label">
                  { name }<button className="btn btn-link btnSort"></button>
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