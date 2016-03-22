
import React, { Component } from 'react';


export default class CreateQeuryNavbarButton extends Component {


  render() {
    return (

  
      <div>
         <div className="visible-xs"><a type="button" href="#" className="btn navbar-btn" data-toggle="modal" data-target="#analysis"><i className="md-i">settings</i></a></div>
         
         <div className="hidden-xs"  data-localize="query.help" data-toggle="tooltip" data-placement="right" title="Open navbar and create new analises query" data-container="body" data-trigger="hover">
           <a onClick={this.props.toggleQueryNavbar} type="button" href="#" className="btn navbar-btn" id="btnToggle" data-target="#subnav" data-toggle="collapse">Analysis
         </a></div>
      </div>

    )
  }
}
