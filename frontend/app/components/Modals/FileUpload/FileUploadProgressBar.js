import React, { Component } from 'react';
import { ProgressBar } from 'react-bootstrap';

export default class FileUploadProgressBar extends Component {

  render() {


    return (

      <ProgressBar now={60} label="%(percent)s%" />

    )
  }
}
