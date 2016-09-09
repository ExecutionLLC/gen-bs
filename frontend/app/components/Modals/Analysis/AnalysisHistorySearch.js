import React from 'react';

// TODO rename props 'filter'
export default class AnalysisHistorySearch extends React.Component {
    render() {
        return (
            <div className='navbar navbar-static-top'>
                <div className='table-row'>
                    <div className='max-width navbar-search navbar-search-left'>
                        <div className='navbar-search-field'>
                            <input
                                type='text'
                                value={this.props.filter}
                                className='form-control material-input-sm'
                                placeholder='Search for analyses name or description'
                                onChange={(e) => this.props.onFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
