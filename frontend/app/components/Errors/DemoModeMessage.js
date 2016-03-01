import React, { Component } from 'react';

export default class DemoModeMessage extends Component {

  render() {
    console.log('err', this.props.errorMessage)
    return (
      <div className="alert alert-inverse alert-fixed" role="alert">
        { this.props.errorMessage &&
          <h3 className="text-center">{this.props.errorMessage}</h3>
        }
          <h3 className="text-center">You are in Demo Mode. Please, login.</h3>
      </div>
    )
  }
}
