import React, { Component } from 'react';


export default class Analyze extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

      <div className="table-cell">
          <div className="btn-group btn-group-history"  data-localize="history.help"  data-toggle="tooltip" data-placement="bottom" data-container="body" title="History of queries, saved query settings">
               <button data-target="#history" data-toggle="modal" type="button" className="btn btn-default"><span  data-localize="history.title">Load history</span></button>
          </div>
      </div>

    )
  }
}
