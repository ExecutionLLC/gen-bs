import React, { Component } from 'react';
import { connect } from 'react-redux'

import DialogBase from './DialogBase';
import {closeSavedFilesDialog, downloadSavedFile} from '../../actions/savedFiles';

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
                    <tbody>
                    {_.map(savedFiles, savedFile => this.renderSavedFileRow(savedFile))}
                    </tbody>
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
        const {name, filter, view, sample, timestamp} = savedFile;
        return (
            <tr>
                <td>{name}</td>
                <td>{filter.name}</td>
                <td>{view.name}</td>
                <td>{sample.name}</td>
                <td>{timestamp}</td>
                <td>
                    <button
                        onClick={() => this.onDownloadClick(savedFile)}
                        type="button"
                        className="btn btn-default"
                    >
                        <span>Download</span>
                    </button>
                </td>
            </tr>
        );
    }
    
    onDownloadClick(savedFile) {
        const {dispatch} = this.props;
        dispatch(downloadSavedFile(savedFile));
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
    const { savedFiles: {list} } = state;

    return {
        savedFiles: list
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
