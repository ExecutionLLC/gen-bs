import React from 'react';

import config from '../../../../config';


export default class AnalysisHistorySearch extends React.Component {
    render() {
        const {p} = this.props;
        return (
            <div className='split-top'>
                <div className='navbar-search navbar-search-left'>
                    <div className='navbar-search-field'>
                        <input
                            type='text'
                            value={this.props.search}
                            maxLength={Math.max(
                                config.ANALYSIS.MAX_NAME_LENGTH,
                                config.ANALYSIS.MAX_DESCRIPTION_LENGTH
                            )}
                            className='form-control material-input-sm'
                            placeholder={p.t('analysis.leftPane.searchPlaceHolder')}
                            onChange={(e) => this.props.onSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
