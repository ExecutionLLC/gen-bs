import React, { Component } from 'react';
import { connect } from 'react-redux'

import DialogBase from './DialogBase';
import {closeSavedFilesDialog} from '../../actions/savedFiles';

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
                <table>
                    {_.map(savedFiles, savedFile => this.renderSavedFileRow(savedFile))}
                </table>
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
                onClick={ () => this.onCloseModal() }
                type="button"
                className="btn btn-default"
                data-dismiss="modal"
            >
                <span>Okay</span>
            </button>
        );
    }

    renderSavedFileRow(savedFile) {
        return (
            <tr>
                <td>{savedFile.file_name}</td>
            </tr>
        );
    }

    onCloseModal() {
        const {dispatch} = this.props;
        dispatch(closeSavedFilesDialog());
    }
}

SavedFilesModal.propTypes = {
    showModal: React.PropTypes.bool.isRequired
};

function mapStateToProps(state) {
    const { userData: {savedFiles} } = state;

    return {
        savedFiles
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
