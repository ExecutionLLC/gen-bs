import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { viewBuilderDeleteColumn, viewBuilderAddColumn, viewBuilderChangeColumn } from '../../../actions/viewBuilder'


export default class ViewForm extends Component {

  render() {
    const { dispatch, fields } = this.props
    const view = this.props.viewBuilder.editOrNew ? (this.props.viewBuilder.editedView):(this.props.viewBuilder.newView)


    const selects = view.view_list_items.map( function(viewItem, index) {

      var currentValue = `${viewItem.field_name}@${viewItem.source_name}`

      return (

             <div className="row grid-toolbar level1" key={Math.round(Math.random()*100000000).toString()} >
               
              <div className="col-xs-6 btn-group-select2">
                <div className="btn-group">
                  <button className="btn btn-link btnDrag" disabled="">
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                  </button>
                </div>
                <div className="btn-group">
                  <Select
                    options={ fields.list.map( (f) => { return {value: `${f.name}@${f.source_type}`, label: f.name}} ) }
                    value={currentValue}
                    clearable={false}
                    onChange={ (val) => dispatch(viewBuilderChangeColumn(index, val.value.split('@')[0], val.value.split('@')[1] )) }
                    disabled={view.view_type === 'standard'}
                  />
                </div>
                <div className="btn-group" data-localize="views.setup.settings.sort" data-toggle="tooltip" data-placement="bottom" data-container="body" title="Desc/Asc Descending">
                   <button type="button" className="btn btn-default btnSort active desc" disabled=""></button>
                </div>   
                
                </div>
                 <div className="col-xs-5 input-group">
                  <span className="input-group-addon"  data-localize="views.setup.settings.filter" data-toggle="tooltip" data-placement="bottom" data-container="body" title="Column Filter">
                    <input type="checkbox" id="cCh1" checked="" disabled="" />
                  </span>
                
                  <input type="text" className="form-control" placeholder="Keywords (Optional)" id="cFl1" value="" readonly="" data-localize="views.setup.settings.keywords" />
                  </div>
                  
                 <div className="col-xs-1">
                   <button className="btn-link" disabled="" onClick={ () => dispatch(viewBuilderDeleteColumn(index)) }><i className="fa fa-lg fa-minus-circle"></i></button>
                   <button className="btn-link" disabled="" onClick={ () => dispatch(viewBuilderAddColumn(index)) }><i className="fa fa-lg fa-plus-circle"></i></button>
                 </div>
              </div>
      )
    }.bind(this))

    return (

          <div className="sort-setting copyview collapse in">
             <h5 data-localize="views.setup.settings.title">Table Columns</h5>
            <div className="row grid-toolbar nobg">
            
              <div className="col-xs-6"><small className="text-muted text-order" data-localize="views.setup.settings.columns_order">Order</small> <small className="text-muted" data-localize="views.setup.settings.columns_sorting">Column Name and Multi Sort Order</small></div>
             
              <div className="col-xs-6"><small className="text-muted" data-localize="views.setup.settings.columns_filter">Column Filter and Keywords</small></div>
            </div>
           
            {selects}
        </div>

    )
  }
}
