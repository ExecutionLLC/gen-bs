import React, { Component } from 'react';


export default class Analyze extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

        <div className="table-cell">
            <div className="btn-group btn-group-submit"
              data-localize="query.analyze.help"
              data-toggle="tooltip"
              data-placement="bottom"
              data-container="body"
              title="Analyze current sample with current filters and view">  
              <button className="btn btn-rounded btn-alt-primary" type="button">
                 <span data-localize="query.analyze.title">Analyze</span>
              </button>
            </div>
        </div>

    )
  }
}
