import React from 'react';


export default class FileUploadSampleSearch extends React.Component {

    render() {
        const {search, onSearch} = this.props;
        return (
            <div className='split-top'>
                <div className='navbar navbar-search navbar-search-left'>
                    <div className='navbar-search-field'>
                        <input // FIXME limit
                            type='text'
                            value={search}
                            className='form-control material-input-sm'
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}