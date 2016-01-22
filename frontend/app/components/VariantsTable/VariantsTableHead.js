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
      variantsColumns.filter( filterFunc ).map( (tableFieldId) => {
          let name = '';
          let fieldMetadata = '';

          fieldMetadata =
            _.find(fields.list, (field) => field.id === tableFieldId) ||
            _.find(fields.sourceFieldsList, (field) => field.id === tableFieldId)


          name = (fieldMetadata === undefined) ? tableFieldId : fieldMetadata.name
          
          head.push(
              <th data-label={tableFieldId} key={tableFieldId} > 
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
