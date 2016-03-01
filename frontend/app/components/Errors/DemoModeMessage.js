import React, { Component } from 'react';

export default class DemoModeMessage extends Component {

  render() {
    return (
      <div className="alert alert-inverse alert-fixed" role="alert">
          <h3 className="text-center">You are in Demo Mode. Please, login.</h3>
      </div>
    )
  }
}
