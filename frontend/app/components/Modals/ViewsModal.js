import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

import Select2 from 'react-select2-wrapper';

export default class ViewsModal extends Component {


  render() {
    return (

        <Modal dialogClassName="modal-dialog-primary"  bsSize="lg" show={this.props.showModal} onHide={ () => {this.props.closeModal('views')} }>

          <Modal.Header closeButton>
            <Modal.Title data-localize="views.heading">
              Setup views
            </Modal.Title>
          </Modal.Header>

          <form>

            <Modal.Body>
              <div>
              <div className="collapse in copyview">
                <div className="row grid-toolbar">
                  <div className="col-sm-6">
                    <label data-localize="views.setup.new.name.title">New View</label> 
                    <input type="text" className="form-control text-primary" data-localize="views.setup.new.name.help" placeholder="Set view name a copy" value="Copy Default View" />
                    <div className="help-text text-danger" data-localize="views.setup.new.name.error">Name can not be empty</div>
                  </div>

                <div className="col-sm-5">
                  <label data-localize="general.description">Description</label>
                  <input type="text" className="form-control" data-localize="views.setup.new.description" placeholder="Set view description (optional)" />
                </div>

                <div className="col-sm-1">
                  <button type="button" className="btn btn-default btn-label-indent delete-copy" type="button" data-toggle="collapse" data-target=".copyview"><span data-localize="actions.cancel">Cancel</span></button> 
                </div>
              </div>
            </div> 


                <div className="collapse in copyview">
                  <div className="row grid-toolbar">
                  <div className="col-sm-6">
                    <label data-localize="views.setup.selector.label">Available Views</label>
                  </div>
                </div>
                <div className="alert alert-help"><span data-localize="views.setup.selector.description">Standard view are not edited, duplicate it for custom</span></div>
                  <div className="row grid-toolbar">
                    <div className="col-sm-6">  
                      <Select2
                        multiple={false}
                        data={['Default View', 'Copy of default View', 'User Custom View 1', 'User Custom View 2', 'User Custom View 3']}
                        options={{
                          placeholder: 'Select View',
                       }} />
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
                      <div className="btn-group ">
                        <button className="btn btn-default">
                          <span data-localize="views.setup.reset.title" >Reset View</span>
                        </button> 
                      </div>
                      <div className="btn-group ">
                        <button type="button" className="btn btn-link">
                          <span data-localize="views.setup.delete.title" >Delete View</span>
                        </button> 
                      </div>
                      { //<!-- / -->
                      }
                    </div> 
                  </div>        
                </div>        
              </div>        


            </Modal.Body>

            <Modal.Footer>
              <button onClick={ () => { this.props.closeModal('views')} } type="button" className="btn btn-default" data-dismiss="modal"><span  data-localize="actions.cancel" />Cancel</button>
               <button type="button" className="btn btn-primary"><span data-localize="actions.save_select.title">Save and Select</span></button>
             </Modal.Footer>
           </form>
        </Modal>



    )
  }
}
