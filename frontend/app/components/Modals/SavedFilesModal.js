import React, { Component } from 'react';
import { connect } from 'react-redux'

import DialogBase from './DialogBase';

class SavedFilesModal extends DialogBase {
    constructor(props) {
        super(props, 'savedFiles');
    }

    renderTitleContents() {
        return (
            <div>Saved Files</div>
        );
    }

    renderBodyContents() {
        const {savedFiles} = this.props;
        const haveSavedFiles = !_.isEmpty(savedFiles);
        if (haveSavedFiles) {
            return (
                <div>
                    {_.map(savedFiles, savedFile => this.renderSavedFileRow(savedFile))}
                </div>
            );
        } else {
            return (
                <div>Here will be the files you have exported, but there are no such files for now.</div>
            );
        }
    }

    renderFooterContents() {
        return (
            <button
                onClick={ () => {this.props.closeModal('savedFiles')} }
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
                localize-data="action.extendSession"
            >
                <span>Okay</span>
            </button>
        );
    }

    renderSavedFileRow(savedFile) {
        return (
            <div>Saved file row goes here.</div>
        );
    }
}

SavedFilesModal.propTypes = {
    savedFiles: React.PropTypes.array.isRequired,
    showModal: React.PropTypes.bool.isRequired,
    // callback ('savedFiles')
    closeModal: React.PropTypes.func.isRequired
};

function mapStateToProps(state) {
    const { userData: {savedFiles} } = state;

    return {
        savedFiles
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
