import React, { Component } from 'react';

export default class VariantsTableLoadError extends Component {

  render() {
    return (

        <div className="panel panel-danger">
          <div className="panel-heading">
            <h3 className="panel-title">Error loading Analyze Results Data</h3>
          </div>
          <div className="panel-body">
            <ol>
              {
                this.props.errors.map( (err) => (
                  <li>Code: <strong>{err.code}</strong>; Message: <strong>{err.message}</strong> </li>
                ))
              }
            </ol>
          </div>
        </div>

    )
  }
}
