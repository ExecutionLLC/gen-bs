import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames';

import FileUploadProgressBar from './FileUploadProgressBar';

import {clearUploadState, changeFileForUpload} from '../../../actions/fileUpload';


export default class FileUpload extends Component {

    componentWillMount() {
        this.props.dispatch(clearUploadState())
    }

    render() {
        const {auth: {isDemo}} = this.props;
        const {error, isArchiving} = this.props.fileUpload;
        if (isDemo) {
            return this.renderDemoContent();
        } else {
            return (
                <div className="panel file-upload-panel panel-default">
                    <div className="panel-body">

                        {error && this.renderUploadError(error)}

                        {this.renderUploadButton()}
                        {this.renderSelectedFileInfo()}


                        { isArchiving &&
                        <div className="text-center">
                            <strong style={{color: '#2363a1'}}>Archiving...</strong>
                            <i className="fa fa-spinner fa-spin"></i>
                        </div>
                        }
                        { !error &&
                        <FileUploadProgressBar {...this.props} />
                        }
                    </div>
                </div>
            );
        }
    }

    renderSelectedFileInfo() {
        const {files} = this.props.fileUpload;
        return (
            files[0] &&
            <div className="text-center">
                <strong style={{color: '#2363a1'}}>{files[0].name}</strong>
            </div>
        );
    }

    renderUploadButton() {
        return (
            <button onClick={this.onUploadClick.bind(this)}
                    className="btn-link-light-default btn-select-file">
                <input
                    onChange={ (e) => this.onUploadChanged(e)}
                    style={{display: 'none'}}
                    ref="fileInput"
                    id="file-select"
                    type="file"
                    accept=".vcf,.gz"
                    name="files[]"
                    multiple="multiple"
                />
                <i className="md-i">cloud_upload</i>
                <span>Click here to upload new samples</span>
                <span>.vcf, .vcf.gz</span>
            </button>
        );
    }

    renderUploadError(error) {
        return (
            <div className="alert">
                <p>{error}</p>
            </div>
        );
    }

    renderDemoContent() {
        return (
            <div className="panel panel-empty-state">
                <div className="empty">
                    <h3><i className="md-i">perm_identity</i>Please login or register to upload new samples</h3>
                </div>
            </div>
        );
    }

    onUploadChanged(e) {
        const {dispatch} = this.props;
        dispatch(changeFileForUpload(e.target.files));
    }

    onUploadClick() {
        this.refs.fileInput.click();
    }
}
