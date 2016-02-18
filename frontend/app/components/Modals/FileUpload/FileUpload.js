import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

import FileUploadProgressBar from './FileUploadProgressBar'

import { changeFileForUpload } from '../../../actions/fileUpload'



export default class FileUpload extends Component {

  uploadClickHandler(event) {
    this.refs.fileInput.click()
  }

  render() {
    const { dispatch } = this.props
    const { files, error } = this.props.fileUpload
    return (
          <div className="well text-center">
            <div>

              { error &&
                <div className="alert alert-danger">
                  {error}
                </div>
              }
           
                <button onClick={this.uploadClickHandler.bind(this)} data-target="#fileOpen" data-toggle="modal" className="btn-link-default" style={{paddingBottom: '40px', height: '280px'}}>
                  <input 
                    onChange={ (e) => dispatch(changeFileForUpload(e.target.files))}
                    style={{display: 'none'}}
                    ref="fileInput"
                    id="file-select"
                    type="file"
                    accept=".vcf,.gz"
                    name="files[]"
                  />
                     <i className="fa fa-3x fa-cloud-upload"></i>
                     <span style={{display:'block', margin: '10px 0 0'}}>Drop some files</span>
                    <small style={{opacity:'.6'}}>Or click here</small>
                </button>
                { files[0] &&
                  <p>{files[0].name}</p>
                }
                <div className="small btn-link-default">.vcf, .vcf.gz</div>
            </div>

            { !error &&
              <FileUploadProgressBar {...this.props} />
            }
          </div>



    )
  }
}
