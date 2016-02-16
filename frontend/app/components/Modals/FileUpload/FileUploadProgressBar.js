import React, { Component } from 'react';
import { ProgressBar } from 'react-bootstrap';

export default class FileUploadProgressBar extends Component {

  render() {

    const { progressStatusFromAS, progressValueFromAS } = this.props.fileUpload
    console.log('progress value from jsx', progressValueFromAS)
    console.log('progress Status from jsx', progressStatusFromAS)

    return (

      <div>
        { progressStatusFromAS === 'ajax' &&
          <div>
            <h2>Ajax Uploading</h2>
            <ProgressBar now={progressValueFromAS} label="%(percent)s%" bsStyle="success" />
            <h2>AS Converting</h2>
            <ProgressBar now={0} label="%(percent)s%" bsStyle="success" />
            <h2>AS S3 Uploading</h2>
            <ProgressBar now={0} label="%(percent)s%" bsStyle="info" />
          </div>
        }
        { progressStatusFromAS === 'converting' &&
          <div>
            <h2>Ajax Uploading</h2>
            <ProgressBar now={100} label="%(percent)s%" bsStyle="success" />
            <h2>AS Converting</h2>
            <ProgressBar now={progressValueFromAS} label="%(percent)s%" bsStyle="success" />
            <h2>AS S3 Uploading</h2>
            <ProgressBar now={0} label="%(percent)s%" bsStyle="info" />
          </div>
        }
        { progressStatusFromAS === 's3_uploading' &&
          <div>
            <h2>Ajax Uploading</h2>
            <ProgressBar now={100} label="%(percent)s%" bsStyle="success" />
            <h2>AS Converting</h2>
            <ProgressBar now={100} label="%(percent)s%" striped bsStyle="success" />
            <h2>AS S3 Uploading</h2>
            <ProgressBar now={progressValueFromAS} label="%(percent)s%" bsStyle="info" />
          </div>
        }
        { progressStatusFromAS === 'ready' &&
          <div>
            <h2>Ajax Uploading</h2>
            <ProgressBar now={100} label="%(percent)s%" bsStyle="success" />
            <h2>AS Converting</h2>
            <ProgressBar now={100} label="%(percent)s%" bsStyle="success" />
            <h2>AS S3 Uploading</h2>
            <ProgressBar now={100} label="%(percent)s%" bsStyle="info" />
          </div>
        }
      </div>

    )
  }
}
