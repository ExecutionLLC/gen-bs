import React, { Component } from 'react';
import { ProgressBar } from 'react-bootstrap';

export default class FileUploadProgressBar extends Component {

  render() {

    const { progressStatusFromAS, progressValueFromAS } = this.props.fileUpload

    return (

      <div>
        { progressStatusFromAS === 'ajax' &&
          <div>
            <div className='text-center'><strong>Ajax Uploading</strong></div>
            <ProgressBar now={progressValueFromAS} label='%(percent)s%' bsStyle='success'/>
            <div className='text-center'><strong>AS Converting</strong></div>
            <ProgressBar now={0} label='%(percent)s%' bsStyle='warning'/>
            <div className='text-center'><strong>AS S3 Uploading</strong></div>
            <ProgressBar now={0} label='%(percent)s%' bsStyle='info'/>
          </div>
        }
        { progressStatusFromAS === 'converting' &&
          <div>
            <div className='text-center'><strong>Ajax Uploading</strong></div>
            <ProgressBar now={100} label='%(percent)s%' bsStyle='success'/>
            <div className='text-center'><strong>AS Converting</strong></div>
            <ProgressBar now={progressValueFromAS} label='%(percent)s%' bsStyle='warning'/>
            <div className='text-center'><strong>>AS S3 Uploading</strong></div>
            <ProgressBar now={0} label='%(percent)s%' bsStyle='info'/>
          </div>
        }
        { progressStatusFromAS === 's3_uploading' &&
          <div>
            <div className='text-center'><strong>Ajax Uploading</strong></div>
            <ProgressBar now={100} label='%(percent)s%' bsStyle='success'/>
            <div className='text-center'><strong>AS Converting</strong></div>
            <ProgressBar now={100} label='%(percent)s%' striped bsStyle='warning'/>
            <div className='text-center'><strong>AS S3 Uploading</strong></div>
            <ProgressBar now={progressValueFromAS} label='%(percent)s%' bsStyle='info'/>
          </div>
        }
        { progressStatusFromAS === 'ready' &&
          <div>
            <div className='text-center'><strong>Ajax Uploading</strong></div>
            <ProgressBar now={100} label='%(percent)s%' bsStyle='success'/>
            <div className='text-center'><strong>AS Converting</strong></div>
            <ProgressBar now={100} label='%(percent)s%' bsStyle='warning'/>
            <div className='text-center'><strong>AS S3 Uploading</strong></div>
            <ProgressBar now={100} label='%(percent)s%' bsStyle='info'/>
          </div>
        }
      </div>

    )
  }
}
