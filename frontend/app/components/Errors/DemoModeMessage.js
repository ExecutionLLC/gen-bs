import React, { Component } from 'react';

export default class DemoModeMessage extends Component {

  render() {
    return (
      <div className="alert alert-inverse alert-fixed" role="alert">
        { this.props.errorMessage &&
          <h3 className="text-center">{this.props.errorMessage}</h3>
        }
          <h3 className="text-center">Demo Mode</h3>
          <h3 className="text-center">Please, login</h3>
      </div>
    )
  }
}
