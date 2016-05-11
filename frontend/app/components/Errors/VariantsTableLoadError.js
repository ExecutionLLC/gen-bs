import React, { Component } from 'react';

export default class VariantsTableLoadError extends Component {

    render() {
        const error = this.props.error;
        return (

            <div className="panel panel-danger">
                <div className="panel-heading">
                    <h3 className="panel-title">Error loading Analyze Results Data</h3>
                </div>
                <div className="panel-body">
                    Code: <strong>{error.code}</strong>; Message: <strong>{error.message}</strong>
                </div>
            </div>

        )
    }
}
