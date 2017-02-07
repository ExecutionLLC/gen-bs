import React, {Component} from 'react';

export default class VariantsTableLoadError extends Component {

    render() {
        const {error, p} = this.props;
        return (

            <div className='panel panel-danger'>
                <div className='panel-heading'>
                    <h3 className='panel-title'>{p.t('errors.unexpectedErrorTitle')}</h3>
                </div>
                {error && <div className='panel-body'>
                    <div>
                        <strong>{error.message}</strong>
                    </div>
                    <div>
                        <small>{p.t('errors.errorCode', {errorCode: error.code})}</small>
                    </div>
                </div>}
            </div>

        );
    }
}
