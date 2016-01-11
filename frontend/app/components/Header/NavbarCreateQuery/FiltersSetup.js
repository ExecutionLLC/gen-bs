import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class FiltersSetup extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

      <div className="table-cell">
          <div className="dropdown btn-group" data-localize="filters.setup.help"  data-toggle="tooltip" data-placement="right" data-container="body" title="Setup, combine, create custom new filters or combine default">
              <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                <span data-localize="filters.title">Filters</span> <span className="caret"></span>
              </button>
            <ul className="dropdown-menu dropdown-menu-item-template">
              <li><a href="#" type="button" data-toggle="modal" data-target="#filter"><span data-localize="filters.setup.title">Setup Filters</span></a></li>
              <li><a href="#" type="button" data-toggle="modal" data-target="#combinefilter"><span data-localize="filters.combine.title">Combine Filters</span></a></li>
              
            </ul>
          </div>
     </div>


    )
  }
}
