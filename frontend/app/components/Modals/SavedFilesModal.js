import React from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import {getP} from 'redux-polyglot/dist/selectors';

import DialogBase from './DialogBase';
import {closeSavedFilesDialog, downloadSavedFileAsync} from '../../actions/savedFiles';

class SavedFilesModal extends DialogBase {
    constructor(props) {
        super(props, 'savedFiles');
    }

    get haveSavedFiles() {
        const {savedFiles} = this.props;
        return !_.isEmpty(savedFiles);
    }

    renderTitleContents() {
        const {p} = this.props;
        return (
            <div>{p.t('savedFiles.title')}</div>
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
        const {isDemo, p} = this.props;
        if (isDemo) {
            return (
                <div className='empty'><h3><i className='md-i'>perm_identity</i>{p.t('savedFiles.registerCaption')}</h3></div>
            );
        } else {
            return (
                <div className='empty'><h3><i className='md-i'>hourglass_empty</i>{p.t('savedFiles.emptyCaption')}</h3></div>
            );
        }
    }

    renderBodyContents() {
        if (!this.haveSavedFiles) {
            return this.renderEmptyContents();
        }
        const {savedFiles, p} = this.props;
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
                          <th>{p.t('savedFiles.headerDate')}</th>
                          <th>{p.t('savedFiles.headerSample')}</th>
                          <th>{p.t('savedFiles.headerFilter')}</th>
                          <th>{p.t('savedFiles.headerView')}</th>
                          {/*TODO check Models header after the merge*/}
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
        const {samplesList: {hashedArray: {hash: samplesHashedArray}}, p} = this.props;
        const savedFileSamples = _.map(samples, sample => samplesHashedArray[sample.id]);
        const savedFileSamplesNames = _.map(savedFileSamples, sample => sample ? sample.name : '???');
        return (
            <tr key={savedFile.id}>
                <td>{Moment(timestamp).format('DD MM YYYY HH:mm:ss')}</td>
                <td>{savedFileSamplesNames.join(', ')}</td>
                <td>{filter.name}</td>
                <td>{view.name}</td>
                <td>{model ? model.name : ''}</td>
                <td>
                    <button
                        onClick={() => this.onDownloadClick(savedFile)}
                        type='button'
                        className='btn btn-uppercase btn-link'
                    >
                        <span>{p.t('savedFiles.buttonDownload')}</span>
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
    const { savedFiles: {list}, auth: {isDemo}, samplesList } = state;

    return {
        savedFiles: list,
        isDemo,
        samplesList,
        p: getP(state)
    };
}

export default connect(mapStateToProps)(SavedFilesModal);
