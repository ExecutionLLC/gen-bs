import React, { Component } from 'react';
import classNames from 'classnames';

export default class VariantsTableRows extends Component {

  render() {
    const { variants, fields } = this.props
    const { sort } = this.props.variantsTable.searchInResultsParams
    let rows;

    const filterFunc = (label) => {
      return (
        (label !== 'comment') && 
        (label !== 'search_key')
      )
    }


    if (!variants) {
      rows = null;
    } else {
      rows = this.props.variants.map(function(rowData, i) {
        let row = [];
        const columnNames = Object.keys(rowData)

        row.push(<td key="row_linenumber">{i+1}</td>);
        row.push(<td key="row_checkbox"><input type="checkbox"/></td>);
        row.push(<td className="comment" key="comment">{rowData['comment']}</td>);

        columnNames.filter(filterFunc).map( (key) => {
          let columnSortParams = _.find(sort, sortItem => sortItem.field_id === key)

          let sortedActiveClass = classNames({
            'active': columnSortParams
          });
          row.push(
            <td className={sortedActiveClass} key={key}>{rowData[key]}</td>
          );
        })
        

        return (
          <tr key={i}>
            {row}
          </tr>
        )
      })
    }

    return (
      <tbody id="variants_table_body">{rows}</tbody>
    )
  }
}
