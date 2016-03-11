import React, { Component } from 'react';


export default class NavbarSearch extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

      <div className="navbar-search">
        <div className="navbar-search-field width">
          <input
            type="text"
            data-localize="results.search"
            className="form-control placeholder-inverse"
            placeholder="Search for mutations of current sample analysis"
            data-localize=""
          />
        </div>
      </div> 

    )
  }
}
