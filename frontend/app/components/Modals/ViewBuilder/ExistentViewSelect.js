import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { viewBuilderSelectView } from '../../../actions/viewBuilder'


export default class ExistentViewSelect extends Component {


  render() {
    console.log('exist v', this.props)
    const { dispatch, showModal, closeModal } = this.props
    const { currentView } = this.props.viewBuilder
    const { samples, views, isValid } = this.props.userData
    return (

        <div className="collapse in copyview">
            <div className="row grid-toolbar">
                <div className="col-sm-6">
                  <label data-localize="views.setup.selector.label">Available Views</label>
                </div>
            </div>
            { currentView.view_type === 'standard' &&
              <div className="alert alert-help"><span data-localize="views.setup.selector.description">Standard view are not edited, duplicate it for custom</span>
              </div>
            }
            <div className="row grid-toolbar">
                <div className="col-sm-6">  
                    <Select
                      options={views.map( v => { return {value: v.id, label: v.name} } )}
                      value={currentView.id}
                      clearable={false}
                      onChange={ (val) => dispatch(viewBuilderSelectView(views, val.value))}
                    />
                </div>    
                <div className="col-sm-6">
                    <div className="btn-group" data-localize="actions.duplicate.help" data-toggle="tooltip" data-placement="bottom" data-container="body" title="Сopy this to a new">
                        <button type="button" className="btn btn-default collapse in copyview" data-toggle="collapse" data-target=".copyview" id="dblBtn">
                            <span data-localize="actions.duplicate.title">Duplicate</span>
                        </button> 
                    </div>
              {
                //<!--   Видимы когда в селекторе выбраны пользовательские вью, которые можно редактировать -->
              }
                    { currentView.view_type !== 'standard' &&
                      <div className="btn-group ">
                          <button className="btn btn-default">
                              <span data-localize="views.setup.reset.title" >Reset View</span>
                          </button> 
                      </div>
                    }
                    { currentView.view_type !== 'standard' &&
                      <div className="btn-group ">
                          <button type="button" className="btn btn-link">
                              <span data-localize="views.setup.delete.title" >Delete View</span>
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
