import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


export default class ViewBuilderFooter extends Component {

  render() {

    return (

        <Modal.Footer>
          <button onClick={ () => { this.props.closeModal('views')} } type="button" className="btn btn-default" data-dismiss="modal"><span  data-localize="actions.cancel" />Cancel</button>
           <button type="button" className="btn btn-primary"><span data-localize="actions.save_select.title">Save and Select</span></button>
         </Modal.Footer>

    )
  }
}
