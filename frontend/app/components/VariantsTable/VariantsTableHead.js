import React, { Component } from 'react';
import  { firstCharToUpperCase } from '../../utils/stringUtils'

import { changeVariantsFilter, changeVariantsSort, searchInResults } from '../../actions/variantsTable'

export default class VariantsTableHead extends Component {

  _filterInputs(fieldId) {
    const { dispatch, variants, fields } = this.props
    const fieldMetadata =
      _.find(fields.list, (field) => field.id === fieldId) ||
      _.find(fields.sourceFieldsList, (field) => field.id === fieldId)


    const fieldValueType = (fieldMetadata === undefined) ? undefined : fieldMetadata.value_type

    if (fieldValueType === 'string') {
      return (
        <div>
          <input type="text" className="form-control"
            value={
              Object.assign({}, ...this.props.variantsTable.searchInResultsParams.search)[fieldId]
            }
            onChange={(e) => dispatch(changeVariantsFilter(variants, fieldId, e.target.value))}
            onKeyPress={(e) => e.charCode === 13 ? dispatch( searchInResults() ): null }
          />
        </div>
      )
    } else {
      return (
        <div>
          <input type="text" className="form-control"
            value="Non-filtered type"
            disabled
          />
        </div>
      )
    }
  }

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
                <div>
                  <span className="variants-table-header-label">
                    { name }
                    <button className="btn btn-link btnSort" onClick={ e => dispatch(changeVariantsSort(tableFieldId, 1, 'asc')) }></button>
                  </span>
                    <button className="btn btn-default" onClick={ e => dispatch(changeVariantsSort(tableFieldId, 1, 'desc')) }>Sort2</button>
                </div>
                {this._filterInputs(tableFieldId)}
              </th>
          )
      });

    }

    return (
      <thead id="variants_table_head"><tr>{head}</tr></thead>
    )
  }
}
