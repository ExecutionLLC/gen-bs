import React, { Component } from 'react';

export default class VariantsTableRows extends Component {

  render() {
    const { variants, fields } = this.props
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

        row.push(<td key="row_checkbox"><input type="checkbox"/></td>);
        row.push(<td className="comment" key="comment">{rowData['comment']}</td>);

        columnNames.filter(filterFunc).map( (key) => {
          row.push(
            <td className={key} key={key}>{rowData[key]}</td>
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
