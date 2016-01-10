import React, { Component } from 'react';

export default class VariantsTableRows extends Component {

  render() {
    const variants = this.props.variants; 
    let rows;

    if(!variants) {
      rows = null;
    } else {
      rows = this.props.variants.map(function(rowData) {
        let row = [];

        row.push(<td><input type="checkbox" /></td>);
        row.push(<td class="comment">{rowData['comment']}</td>);

        for(var key in rowData) {
          if(key !== 'comment') {
            row.push(
              <td className={key} key={key}>{rowData[key]}</td>
            );
          }
        }
        return (
          <tr key={rowData._fid}>
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
