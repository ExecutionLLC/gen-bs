import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import FileUploadProgressBar from './FileUploadProgressBar'

import { clearUploadState, changeFileForUpload } from '../../../actions/fileUpload'



export default class FileUpload extends Component {

  componentWillMount() {
    this.props.dispatch(clearUploadState())
  }

  uploadClickHandler(event) {
    this.refs.fileInput.click()
  }

  render() {
    const { dispatch, auth } = this.props
    const { files, error, isArchiving } = this.props.fileUpload
    if (auth.isDemo){
        return (
            <div className="well text-center">
                Please login or register to upload new samples
                </div>)
    }else
        return (
          <div className="well text-center">
            <div>

              { error &&
                <div>
                  <h2 className="text-center" style={{color: 'red'}} >{error}</h2>
                </div>
              }

                <button onClick={this.uploadClickHandler.bind(this)} data-target="#fileOpen" data-toggle="modal" className="btn-link-default" >
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
                  <h2 style={{color: '#2363a1'}}>{files[0].name}</h2>
                }
                <div className="small">.vcf, .vcf.gz</div>
            </div>

            { isArchiving &&
              <div><h2 style={{color: '#2363a1'}}>Archiving...</h2><i className="fa fa-spinner fa-spin"></i></div>
            }
            { !error &&
              <FileUploadProgressBar {...this.props} />
            }
          </div>



    )
  }
}
