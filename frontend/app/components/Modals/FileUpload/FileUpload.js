import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


export default class FileUpload extends Component {

  uploadClickHandler(event) {
    this.refs.fileInput.click()
  }

  render() {
    return (
        <div className="well text-center">
          <div>
         
              <button onClick={this.uploadClickHandler.bind(this)} data-target="#fileOpen" data-toggle="modal" className="btn-link-default" style={{paddingBottom: '40px', height: '280px'}}>
                  <input style={{display: 'none'}} ref="fileInput" id="file-select" type="file" accept=".vcf" name="files[]"  />
                   <i className="fa fa-3x fa-cloud-upload"></i>
                   <span style={{display:'block', margin: '10px 0 0'}}>Drop some files</span>
                  <small style={{opacity:'.6'}}>Or click here</small>
              </button>
              <div className="small btn-link-default">.vcf, .vcf.gz</div>
          </div>

          <div className="progress hidden">
              <div className="progress progress-striped">
              <div style={{width: '40%'}} aria-valuemax="100" aria-valuemin="0" aria-valuenow="40" role="progressbar" className="progress-bar progress-bar-primary progress-bar-primary">
              <span className="sr-only">40% <span data-localize="general.complete">Complete</span> (<span data-localize="general.success_simple">success</span>)</span>
              </div>
              </div>
          </div>
        </div>

    )
  }
}
