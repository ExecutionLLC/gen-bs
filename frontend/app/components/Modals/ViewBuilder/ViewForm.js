import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';


export default class ViewForm extends Component {

  componentWillReceiveProps() {
    console.log('tag', this.refs)
  }

  render() {
    const { fields } = this.props
    const { currentView } = this.props.viewBuilder

    const selects = currentView.view_list_items.map( function(viewItem) {
      console.log('col names: ', _.find(fields.list, (f) => f.id === viewItem.field_id ).name)
      const defaultValue = _.find(fields.list, (f) => f.id === viewItem.field_id).id
      console.log('default: ',defaultValue) 
    console.log('tag', this.refs)

      return (

             <div className="row grid-toolbar level1">
               
              <div className="col-xs-6 btn-group-select2">
                <div className="btn-group">
                  <button className="btn btn-link btnDrag" disabled="">
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                  </button>
                </div>
                <div className="btn-group">
                  <Select2
                    ref={`view_item_${viewItem.id}`}
                    multiple={false}
                    data={fields.list.map( f => { return {id: f.id, text: f.name} } )}
                    defaultValue={defaultValue}
                    onSelect={ (e) => console.log('select')}
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
                   <button className="btn-link" disabled=""><i className="fa fa-lg fa-minus-circle"></i></button>
                   <button className="btn-link" disabled=""><i className="fa fa-lg fa-plus-circle"></i></button>
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
