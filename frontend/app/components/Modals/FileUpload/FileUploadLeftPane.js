import React from 'react';
import FileUploadSampleSearch from './FileUploadSampleSearch';
import FileUploadSampleList from './FileUploadSampleList';

import {
    setCurrentSampleId,
    setCurrentSampleSearch
} from '../../../actions/samplesList';

export default class FileUploadLeftPane extends React.Component {

    render() {
        const {
            samplesList, sampleSearch, currentSampleId
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
                />
            </div>
        );
    }

    onSampleSearchChange(str) {
        this.props.dispatch(setCurrentSampleSearch(str));
    }

    onCurrentSampleIdChange(id) {
        this.props.changeShowValues(false);
        this.props.dispatch(setCurrentSampleId(id));
    }
}