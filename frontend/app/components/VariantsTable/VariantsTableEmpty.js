import React, { Component } from 'react';

export default class VariantsTableEmpty extends Component {

    render() {
        return (
            <div className='table-variants-message'>
                <div className='empty'>
                      <h3>
                      <i className='md-i'>hourglass_empty</i>
                          Results are empty!
                      </h3>
                </div>
            </div>

        );
    }
}
