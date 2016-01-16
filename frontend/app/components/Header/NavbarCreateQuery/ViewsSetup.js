import React, { Component } from 'react';

export default class ViewsSetup extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (

       <div className="table-cell">
         <div className="btn-group"  data-localize="views.setup.help" data-toggle="tooltip" data-placement="bottom" data-container="body" title="Setup custom new views, select colunms, colunm order, sorting and colunm filter">
           <button
             className="btn btn-default" type="button" data-toggle="modal" data-target="#selectColumns"
             onClick={this.props.openModal.bind(this, 'views')}
           >
             <span data-localize="views.title">Views</span>
           </button>
         </div>
       </div> 


    )
  }
}