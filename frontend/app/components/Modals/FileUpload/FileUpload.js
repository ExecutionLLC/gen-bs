import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import classNames from 'classnames';

import FileUploadProgressBar from './FileUploadProgressBar';

import { clearUploadState, changeFileForUpload } from '../../../actions/fileUpload';


export default class FileUpload extends Component {

  componentWillMount() {
    this.props.dispatch(clearUploadState())
  }

  uploadClickHandler(event) {
    this.refs.fileInput.click();
  }

  render() {
    const { dispatch, auth } = this.props;
    const { files, error, isArchiving } = this.props.fileUpload;
    if (auth.isDemo){
        return (
            <div className="panel panel-primary">
                <div className="panel-heading">
                   Please login or register to upload new samples
                </div>
            </div>
        );
    } else {
        return (
          <div className="panel panel-default">
                <div className="panel-body">

              { error &&
                <div className="alert alert-danger">
                  <p>{error}</p>
                </div>
              }

                <button onClick={this.uploadClickHandler.bind(this)} data-target="#fileOpen" data-toggle="modal" className="btn-link-light-default btn-select-file" >
                  <input
                    onChange={ (e) => dispatch(changeFileForUpload(e.target.files))}
                    style={{display: 'none'}}
                    ref="fileInput"
                    id="file-select"
                    type="file"
                    accept=".vcf,.gz"
                    name="files[]"
                  />
                     <i className="md-i">cloud_upload</i>
                     <span>Drop some files</span>
                     <small>Or click here</small>
                     <span>.vcf, .vcf.gz</span>
                </button>
                { files[0] &&
                  <strong style={{color: '#2363a1'}}>{files[0].name}</strong>
                }
            </div>

            { isArchiving &&
              <div><strong style={{color: '#2363a1'}}>Archiving...</strong><i className="fa fa-spinner fa-spin"></i></div>
            }
            { !error &&
              <FileUploadProgressBar {...this.props} />
            }
          </div>
        );
    }
  }
}
