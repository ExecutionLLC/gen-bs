import React, {Component} from 'react';

export default class VariantsTableLoadError extends Component {

    render() {
        const error = this.props.error;
        return (

            <div className='panel panel-danger'>
                <div className='panel-heading'>
                    <h3 className='panel-title'>Unexpected Error</h3>
                </div>
                {error && <div className='panel-body'>
                    <div>
                        <strong>{error.message}</strong>
                    </div>
                    <div>
                        <small>Error code: {error.code}</small>
                    </div>
                </div>}
            </div>

        );
    }
}
