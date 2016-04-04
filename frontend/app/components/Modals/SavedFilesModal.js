import React, { Component } from 'react';
import Moment from 'moment';
import { connect } from 'react-redux'

import DialogBase from './DialogBase';
import {closeSavedFilesDialog, downloadSavedFile} from '../../actions/savedFiles';

class SavedFilesModal extends DialogBase {
    constructor(props) {
        super(props, 'savedFiles');
    }

    get haveSavedFiles() {
        const {savedFiles} = this.props;
        return !_.isEmpty(savedFiles);
    }

    renderTitleContents() {
        return (
            <div>Saved Files</div>
        );
    }

    renderFooter() {
        return null;
    }

    getBodyClassNames() {
        if (this.haveSavedFiles) {
            return ['table-content'];
        } else {
            return [];
        }
    }

    renderEmptyContents() {
        const {isDemo} = this.props;
        if (isDemo) {
            return (
                <div>Please register to access your saved files here.</div>
            );
        } else {
            return (
                <div>Here will be the files you have exported, but there are no such files for now.</div>
            );
        }
    }

    renderBodyContents() {
        if (!this.haveSavedFiles) {
            return this.renderEmptyContents();
        }
        const {savedFiles} = this.props;
        // Now just take last ten elements.
        // TODO: Add pagination for saved files.
        const sortedFiles = _(savedFiles)
            .sortBy(file => -Moment(file.timestamp).valueOf())
            .take(10)
            .value();
        return (
            <div className="table-wrapper table-files-wrapper">
                <div className="table-container table-variants-container">
                    <table className="table table-condensed">
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sample</th>
                            <th>Filter</th>
                            <th>View</th>
                        </tr>
                        </thead>
                        <tbody>
                        {_.map(sortedFiles, file => this.renderSavedFileRow(file))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    renderSavedFileRow(savedFile) {
        const {filter, view, sample, timestamp} = savedFile;
        return (
            <tr key={savedFile.id}>
                <td>{Moment(timestamp).format('DD MM YYYY HH:mm:ss')}</td>
                {
                    // TODO: Remove after snake-camel-hell is gone.
                }
                <td>{sample.file_name || sample.fileName}</td>
                <td>{filter.name}</td>
                <td>{view.name}</td>
                <td>
                    <button
                        onClick={() => this.onDownloadClick(savedFile)}
                        type="button"
                        className="btn btn-uppercase btn-link"
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
    const { savedFiles: {list}, auth: {isDemo} } = state;

    return {
        savedFiles: list,
        isDemo
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
