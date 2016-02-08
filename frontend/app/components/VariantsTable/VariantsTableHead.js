import React, { Component } from 'react';
import  { firstCharToUpperCase } from '../../utils/stringUtils'

import { changeVariantsFilter, sort, searchInResults } from '../../actions/variantsTable'

export default class VariantsTableHead extends Component {

  _filterInputs(fieldId) {
    const { dispatch, variants, fields } = this.props
    const fieldMetadata =
      _.find(fields.list, (field) => field.id === fieldId) ||
      _.find(fields.sourceFieldsList, (field) => field.id === fieldId)


    const fieldValueType = (fieldMetadata === undefined) ? undefined : fieldMetadata.value_type

    if (fieldValueType === 'string') {
      console.log('input value', this.props.variantsTable.searchInResultsParams.search)
      console.log('input field_id', fieldId)
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
              <th data-label="comment" key="comment" > 
                <div>
                  <div className="variants-table-header-label">
                      <a type="button" className="btn btn-link" data-toggle="popover" data-html="true" data-container="body" data-placement="bottom" data-template='<div className="popover variants-table-th-filter" role="tooltip"><div className="popover-content"></div></div>' data-content='<input type="text" className="form-control">'>
                          COMMENT
                      </a>

                      <div className="btn-group-vertical" role="group" data-toggle="buttons">
                        <button className="btn btn-link btnSort asc" onClick={ e => dispatch(changeVariantsSort(tableFieldId, 1, 'asc')) }>
                          <input type="radio" name="options" id="option1" />
                        </button>
                        <button className="btn btn-link btnSort desc " onClick={ e => dispatch(changeVariantsSort(tableFieldId, 1, 'desc')) }>
                          <input type="radio" name="options" id="option2" />
                        </button>
                      </div>
                  </div>
                </div>
                <div>
                  <input type="text" className="form-control"
                    value=""
                  />
                </div>
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
                  <div className="variants-table-header-label">
                      <a type="button" className="btn btn-link" data-toggle="popover" data-html="true" data-container="body" data-placement="bottom" data-template='<div className="popover variants-table-th-filter" role="tooltip"><div className="popover-content"></div></div>' data-content='<input type="text" className="form-control">'>
                        {firstCharToUpperCase(name)}
                      </a>

                      <div className="btn-group-vertical" role="group" data-toggle="buttons">
                        <button className="btn btn-link btnSort asc" onClick={ e => dispatch(sort(tableFieldId, 1, 'asc')) }>
                          <input type="radio" name="options" id="option1" />
                        </button>
                        <button className="btn btn-link btnSort desc " onClick={ e => dispatch(sort(tableFieldId, 1, 'desc')) }>
                          <input type="radio" name="options" id="option2" />
                        </button>
                      </div>
                  </div>
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
