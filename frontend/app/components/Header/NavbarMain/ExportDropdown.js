import React, { Component } from 'react';

export default class ExportDropdown extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <div>
          <div className="dropdown" data-localize="files.export.help" data-toggle="tooltip" data-placement="right" title="Select several mutations in the table and save to file" data-container="body" data-trigger="hover">

              <a className="btn navbar-btn dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="modal" data-target="#filename">
                <span className="hidden-xxs" data-localize="files.export.title">Export</span>
                <span className="visible-xxs"><i className="fa fa-lg fa-cloud-download"></i></span>
              </a>
          </div>

        </div>

    )
  }
}
