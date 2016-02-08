import React, { Component } from 'react';

export default class SavedFiles extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <div className="hidden-xxs" data-localize="files.help" data-toggle="tooltip" data-placement="left" title="History of saved files" data-container="body" data-trigger="hover">
          <a href="" className="btn navbar-btn" data-toggle="modal" data-target="#exporthistory">
            <span data-localize="files.title">Saved files</span>
          </a>
        </div>  

    )
  }
}
