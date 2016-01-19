import React, { Component } from 'react';

export default class Upload extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <div className="table-cell">
            <div className="btn-group" data-localize="samples.upload.help" data-toggle="tooltip" data-placement="bottom" data-container="body"  title="Upload .vfc file of sample">
                 <a href="#" className="btn btn-primary" data-toggle="modal" type="button" data-target="#upload"><span data-localize="samples.upload.title">Upload</span></a>
            </div>
        </div>

    )
  }
}
