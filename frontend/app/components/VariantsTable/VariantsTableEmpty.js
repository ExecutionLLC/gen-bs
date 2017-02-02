import React, { Component } from 'react';

export default class VariantsTableEmpty extends Component {

    render() {
        const {p} = this.props;

        return (
            <div className='table-variants-message'>
                <div className='empty'>
                      <h3>
                      <i className='md-i'>hourglass_empty</i>
                          {p.t('variantsTableEmpty')}
                      </h3>
                </div>
            </div>
        );
    }
}
