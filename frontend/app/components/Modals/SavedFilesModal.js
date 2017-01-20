import React from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';

import DialogBase from './DialogBase';
import {closeSavedFilesDialog, downloadSavedFileAsync} from '../../actions/savedFiles';
import * as i18n from '../../utils/i18n';

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
                <div className='empty'><h3><i className='md-i'>perm_identity</i>Please register to access your saved files here.</h3></div>
            );
        } else {
            return (
                <div className='empty'><h3><i className='md-i'>hourglass_empty</i>Here will be the files you have exported, but there are no such files for now.</h3></div>
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
            <div className='modal-body-scroll'>
                  <table className='table table-condensed table-vertical-top table-responsive-transform table-export-labels'>
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
        );
    }

    renderSavedFileRow(savedFile) {
        const {filter, view, model, samples, timestamp} = savedFile;
        const {samplesList: {hashedArray: {hash: samplesHashedArray}}, ui: {languageId}} = this.props;
        const savedFileSamples = _.map(samples, sample => samplesHashedArray[sample.id]);
        const savedFileSamplesNames = _.map(savedFileSamples, sample => sample ? sample.name : '???');
        debugger;//see model 2, see filter crunch
        return (
            <tr key={savedFile.id}>
                <td>{Moment(timestamp).format('DD MM YYYY HH:mm:ss')}</td>
                <td>{savedFileSamplesNames.join(', ')}</td>
                <td>{(i18n.getEntityText(filter, languageId) || {}/*FIXME crutch for no filter name*/).name}</td>
                <td>{i18n.getEntityText(view, languageId).name}</td>
                <td>{model ? model.name : ''/*TODO langu model*/}</td>
                <td>
                    <button
                        onClick={() => this.onDownloadClick(savedFile)}
                        type='button'
                        className='btn btn-uppercase btn-link'
                    >
                        <span>Download</span>
                    </button>
                </td>
            </tr>
        );
    }
    
    onDownloadClick(savedFile) {
        const {dispatch} = this.props;
        dispatch(downloadSavedFileAsync(savedFile));
    }

    onCloseModal() {
        const {dispatch} = this.props;
        dispatch(closeSavedFilesDialog());
    }
}

SavedFilesModal.propTypes = {
    savedFiles: React.PropTypes.array.isRequired,
    showModal: React.PropTypes.bool.isRequired
};

function mapStateToProps(state) {
    const { savedFiles: {list}, auth: {isDemo}, samplesList, ui } = state;

    return {
        savedFiles: list,
        isDemo,
        samplesList,
        ui
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
