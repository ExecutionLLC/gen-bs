import React from 'react';
import config from '../../../../config';


export default class FileUploadSampleSearch extends React.Component {

    render() {
        const {search, onSearch} = this.props;
        return (
            <div className='split-top'>
                <div className='navbar navbar-search navbar-search-left'>
                    <div className='navbar-search-field'>
                        <input
                            type='text'
                            value={search}
                            maxLength={Math.max(
                                config.UPLOADS.MAX_NAME_LENGTH,
                                config.UPLOADS.MAX_DESCRIPTION_LENGTH,
                                config.SAMPLES.MAX_PROPERTY_LENGTH
                            )}
                            className='form-control material-input-sm'
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}