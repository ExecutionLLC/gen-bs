import React from 'react';


export default class AnalysisHistorySearch extends React.Component {
    render() {
        return (
            <div className='navbar navbar-static-top'>
                <div className='table-row'>
                    <div className='max-width navbar-search navbar-search-left'>
                        <div className='navbar-search-field'>
                            <input
                                type='text'
                                className='form-control material-input-sm'
                                placeholder='Search for analyses name or description'
                                onChange={(e) => this.props.onFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button className='btn btn-default navbar-btn'>
                            <i className='md-i'>add</i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
