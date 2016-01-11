import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

export default class ViewsModal extends Component {


  render() {
    return (

        <Modal show={this.props.showModal} onHide={ () => {this.props.closeModal('views')} }>

          <Modal.Header closeButton>
            <Modal.Title>
              <h4 className="modal-title" id="selectColumnsLabel" data-localize="views.heading">Setup views</h4>
            </Modal.Title>
          </Modal.Header>

          <form>

            <Modal.Body>



            </Modal.Body>

            <Modal.Footer>
              <button type="button" className="btn btn-default" data-dismiss="modal"><span  data-localize="actions.cancel" />Cancel</button>
               <button type="button" className="btn btn-primary"><span data-localize="actions.save_select.title">Save and Select</span></button>
             </Modal.Footer>
           </form>
        </Modal>



    )
  }
}
