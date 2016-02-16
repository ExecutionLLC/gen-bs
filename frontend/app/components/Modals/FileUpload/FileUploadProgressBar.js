import React, { Component } from 'react';
import { ProgressBar } from 'react-bootstrap';

export default class FileUploadProgressBar extends Component {

  render() {

    const { progressValueFromAS } = this.props.fileUpload

    return (

      <ProgressBar now={progressValueFromAS} label="%(percent)s%" />

    )
  }
}
