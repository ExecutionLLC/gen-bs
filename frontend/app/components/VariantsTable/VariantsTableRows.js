import React, { Component } from 'react';
import classNames from 'classnames';

import { getNextPartOfData } from '../../actions/variantsTable'

export default class VariantsTableRows extends Component {

  componentDidMount() {
    const scrollElement = document.getElementsByClassName('table-variants-container').item(0)
    scrollElement.addEventListener('scroll', this.handleScroll.bind(this));
  }

  componentWillUnmount() {
    const scrollElement = document.getElementsByClassName('table-variants-container').item(0)
    scrollElement.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll(e) {
    //console.log('scroll', e);
    const el = e.target
    const { currentSample, currentView, currentFilter } = this.props.ui
    if (el.scrollHeight - el.scrollTop === el.clientHeight) {
      console.log('scrolled');
      this.props.dispatch(getNextPartOfData()) 
                                           
    }
  }

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
