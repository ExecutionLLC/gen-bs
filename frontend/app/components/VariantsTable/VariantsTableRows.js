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
    const { variants } = this.props.ws
    const variantsLength = (variants === null) ? 0 : variants.length
    if (el.scrollHeight - el.scrollTop === el.clientHeight && variants && variantsLength > 99) {
      this.props.dispatch(getNextPartOfData()) 
                                           
    }
  }

  render() {
    const { variants, fields } = this.props
    const { sort } = this.props.variantsTable.searchInResultsParams
    const { isFilteringOrSorting, isNextDataLoading } = this.props.variantsTable 
    let rows;
    let tbody;
    const variantsLength = (variants === null) ? 0 : variants.length

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

        row.push(<td className="row_linenumber" key="row_linenumber">{i+1}</td>);
        row.push(<td className="row_checkbox" key="row_checkbox"><input type="checkbox"/></td>);
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

    if ( isFilteringOrSorting ) {
      tbody = (
        <tr>
          <td colSpan="100">
            <h2 className="text-center" style={{color: '#2363a1'}}>Loading...<i className="text-center fa fa-spinner fa-spin fa-5x"></i>
            </h2>
          </td>
        </tr>
      )
    } else {
        tbody = rows 
    }


    return (
      <tbody id="variants_table_body">
        {tbody}
        { !isFilteringOrSorting && variantsLength > 99 &&
          <tr>
            <td colSpan="100">
              <h2 className="text-center" style={{color: '#2363a1'}}>Loading...<i className="text-center fa fa-spinner fa-spin fa-3x"></i>
              </h2>
            </td>
          </tr>
        }
      </tbody>
    )
  }
}
