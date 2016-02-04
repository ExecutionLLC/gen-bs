import React, { Component } from 'react';
import  { firstCharToUpperCase } from '../../utils/stringUtils'

import { initSearchInResultsParams } from '../../actions/variantsTable'

export default class VariantsTableHead extends Component {

  render() {
    const { dispatch, variants, fields } = this.props
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

      const searchInResultsParams = variantsColumns.filter((fieldId) => fieldId !== 'search_key').map( (fieldId) => {return {[fieldId]: null}})
      dispatch(initSearchInResultsParams(searchInResultsParams))

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
