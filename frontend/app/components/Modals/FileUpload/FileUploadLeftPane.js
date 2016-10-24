import React from 'react';
import FileUploadSampleSearch from './FileUploadSampleSearch';
import FileUploadSampleList from './FileUploadSampleList';

import {
    setCurrentSampleId,
    setCurrentSampleSearch
} from '../../../actions/samplesList';
import {setCurrentUploadId} from '../../../actions/fileUpload';

export default class FileUploadLeftPane extends React.Component {

    render() {
        const {
            samplesList, sampleSearch, currentSampleId, fileUpload
        } = this.props;
        const {hashedArray: {array: samplesArray}} = samplesList;
        const searchWord = sampleSearch.toLowerCase();
        const filteredSamples = searchWord ?
            samplesArray.filter((sample) => sample.fileName.toLocaleLowerCase().indexOf(searchWord) >= 0) :
            samplesArray;
        return (
            <div className='split-left'>
                <FileUploadSampleSearch
                    search={sampleSearch}
                    onSearch={(str) => this.onSampleSearchChange(str)}
                />
                <FileUploadSampleList
                    sampleList={filteredSamples}
                    currentSampleId={currentSampleId}
                    onSelectSample={(id) => this.onCurrentSampleIdChange(id)}
                    onSelectUpload={(id) => this.onCurrentUploadIdChange(id)}
                    fileUpload={fileUpload}
                />
            </div>
        );
    }

    onSampleSearchChange(str) {
        const {dispatch} = this.props;
        dispatch(setCurrentSampleSearch(str));
    }

    onCurrentSampleIdChange(id) {
        const {changeShowValues, dispatch} = this.props;
        changeShowValues(false);
        dispatch(setCurrentUploadId(null));
        dispatch(setCurrentSampleId(id));
    }

    onCurrentUploadIdChange(id) {
        const {changeShowValues, dispatch} = this.props;
        changeShowValues(false);
        dispatch(setCurrentUploadId(id));
        dispatch(setCurrentSampleId(null));
    }
}