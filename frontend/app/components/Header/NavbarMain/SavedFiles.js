import React, {Component} from 'react';

import {showSavedFilesModal} from '../../../actions/savedFiles';

export default class SavedFiles extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

            <div className='hidden-xxs'>
                <a href='#'
                   className='btn navbar-btn'
                   onClick={() => this.onButtonClick()}
                >
                    <span data-localize='files.title'>Saved files</span>
                </a>
            </div>

        );
    }

    onButtonClick() {
        const {dispatch} = this.props;
        dispatch(showSavedFilesModal());
    }
}
