import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { filterBuilderSelectView, filterBuilderToggleNewEdit } from '../../../actions/filterBuilder'


export default class ExistentFilterSelect extends Component {


  render() {

    const { dispatch, showModal, closeModal } = this.props
    const { currentFilter} = this.props.filterBuilder
    const { samples, filters, isValid } = this.props.userData


    return (

        <div className="collapse in copyview">
            <div className="row grid-toolbar">
                <div className="col-sm-6">
                  <label data-localize="views.setup.selector.label">Available Filters</label>
                </div>
            </div>
            { currentFilter.filter_type === 'standard' &&
              <div className="alert alert-help"><span data-localize="views.setup.selector.description">Standard filter are not edited, duplicate it for custom</span>
              </div>
            }
            <div className="row grid-toolbar">
                <div className="col-sm-6">  
                    <Select
                      options={filters.map( v => { return {value: v.id, label: v.name} } )}
                      value={currentFilter.id}
                      clearable={false}
                      onChange={ (val) => dispatch(filterBuilderSelectFilter(filters, val.value, true))}
                    />
                </div>    
                <div className="col-sm-6">
                    <div className="btn-group" data-localize="actions.duplicate.help" data-toggle="tooltip" data-placement="bottom" data-container="body" title="Сopy this to a new">
                      <button type="button" className="btn btn-default collapse in copyview" data-toggle="collapse" data-target=".copyview" id="dblBtn" onClick={ () => dispatch(filterBuilderToggleNewEdit(false)) } >
                            <span data-localize="actions.duplicate.title">Duplicate</span>
                        </button> 
                    </div>
              {
                //<!--   Видимы когда в селекторе выбраны пользовательские вью, которые можно редактировать -->
              }
                    { currentFilter.filter_type !== 'standard' &&
                      <div className="btn-group ">
                          <button className="btn btn-default">
                              <span data-localize="views.setup.reset.title" >Reset Filter</span>
                          </button> 
                      </div>
                    }
                    { currentFilter.filter_type !== 'standard' &&
                      <div className="btn-group ">
                          <button type="button" className="btn btn-link">
                              <span data-localize="views.setup.delete.title" >Delete Filter</span>
                          </button> 
                      </div>
                    }
              { //<!-- / -->
              }
                </div> 
            </div>        
        </div>        

    )
  }
}
