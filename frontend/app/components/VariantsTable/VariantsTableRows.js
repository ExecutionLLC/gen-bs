import React, { Component } from 'react';

export default class VariantsTableRows extends Component {

  render() {
    const { variants, view, fields } = this.props
    let rows;

    //const viewedFields = _.filter(fields, (field) => view.view_list_items.reduce(
    //  (prev, cur) => prev || (cur.field_id  === field.id) , false ))

    const filterFunc = (label) => {
      return (
        (label !== 'comment') && 
        (label !== 'search_key')
          //  viewedFields.reduce( (prev,cur) => (prev || cur.name === label), false )
      )
    }


    if (!variants || !view) {
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
