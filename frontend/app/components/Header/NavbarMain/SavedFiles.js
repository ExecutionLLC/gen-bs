import React, {Component} from 'react';

import {showSavedFilesModal} from '../../../actions/savedFiles';

export default class SavedFiles extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

            <div>
                <a href="#"
                   className="btn navbar-btn"
                   onClick={() => this.onButtonClick()}
                >
                    <span><span className="hidden-xxs" data-localize="files.title">Saved files</span><span className="visible-xxs"><i className="md-i">archive</i></span></span>
                </a>
            </div>

        )
    }

    onButtonClick() {
        const {dispatch} = this.props;
        dispatch(showSavedFilesModal());
    }
}
