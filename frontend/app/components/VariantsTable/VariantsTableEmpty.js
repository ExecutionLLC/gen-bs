import React, { Component } from 'react';

export default class VariantsTableEmpty extends Component {

  render() {
    return (

        <div className="panel panel-success">
          <div className="panel-heading">
            <h3 className="panel-title">System message</h3>
          </div>
          <div className="panel-body">
            <h3 className="text-center">
              Results are empty!
            </h3>
          </div>
        </div>

    )
  }
}
