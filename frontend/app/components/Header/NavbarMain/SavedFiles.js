import React, {Component} from 'react';

import {showSavedFilesModal} from '../../../actions/savedFiles';

export default class SavedFiles extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

            <div>
                <a href='#'
                   className='btn navbar-btn'
                   onClick={() => this.onButtonClick()}
                >
                    <span><span className='hidden-xs' data-localize='files.title'>Saved Files</span><span className='visible-xs'><i className='md-i'>cloud_circle</i></span></span>
                </a>
            </div>

        );
    }

    onButtonClick() {
        const {dispatch} = this.props;
        dispatch(showSavedFilesModal());
    }
}
