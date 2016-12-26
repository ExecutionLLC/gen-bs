import React from 'react';
import _ from 'lodash';
import FileUploadSampleSearch from './FileUploadSampleSearch';
import FileUploadSampleList from './FileUploadSampleList';

import {
    setCurrentSampleId,
    setEditingSampleId
} from '../../../actions/samplesList';
import {setCurrentUploadId} from '../../../actions/fileUpload';
import {entityType} from '../../../utils/entityTypes';

export default class FileUploadLeftPane extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            searchWord: '',
            samplesSearchHash: this.extractSamplesSearchValues(this.props)
        };
    }

    componentWillReceiveProps(newProps) {
        if (this.props.samplesList === newProps.samplesList) {
            return;
        }
        this.setState({
            samplesSearchHash: this.extractSamplesSearchValues(newProps)
        });
    }

    extractSamplesSearchValues(props) {
        const {samplesList, editableFields} = props;
        const {hashedArray: {array: samplesArray}} = samplesList;

        // Calculates search value for the specified editable field.
        function getSearchValue(editableField, sampleEditableFieldValue) {
            if (_.isNull(sampleEditableFieldValue.value)) {
                return '';
            }
            if (_.isEmpty(editableField.availableValues)) {
                return sampleEditableFieldValue.value;
            }
            return _.find(editableField.availableValues, {'id': sampleEditableFieldValue.value}).value;
        }

        const nonHistorySamples = _.filter(samplesArray, sample => sample.type !== entityType.HISTORY);
        const sampleSearchArray = _.map(nonHistorySamples, sample => {
            const metadataHash = _.keyBy(sample.sampleMetadata, 'metadataId');
            const sampleSearchValues = _.map(editableFields, editableField => {
                const sampleEditableField = metadataHash[editableField.id];
                return getSearchValue(editableField, sampleEditableField)
                    .toLocaleLowerCase();
            });
            sampleSearchValues.push(sample.name.toLocaleLowerCase());
            return {
                sampleId: sample.id,
                searchValues: sampleSearchValues
            };
        });
        return _.keyBy(sampleSearchArray, 'sampleId');
    }

    render() {
        const {dispatch, samplesList, fileUpload, currentSampleId, currentHistorySamplesIds, closeModal} = this.props;
        const {searchWord, samplesSearchHash} = this.state;

        return (
            <div className='split-left'>
                <FileUploadSampleSearch
                    search={searchWord}
                    onSearch={(e) => this.onSampleSearchChange(e)}
                />
                <FileUploadSampleList
                    dispatch={dispatch}
                    sampleList={samplesList}
                    currentSampleId={currentSampleId}
                    onSelectSample={(id) => this.onCurrentSampleIdChange(id)}
                    onSelectUpload={(id) => this.onCurrentUploadIdChange(id)}
                    fileUpload={fileUpload}
                    search={searchWord}
                    samplesSearchHash={samplesSearchHash}
                    currentHistorySamplesIds={currentHistorySamplesIds}
                    closeModal={closeModal}
                />
            </div>
        );
    }

    onSampleSearchChange(str) {
        this.setState({searchWord: str});
    }

    onCurrentSampleIdChange(id) {
        const {changeShowValues, dispatch, onSelectUpload} = this.props;
        changeShowValues(false);
        dispatch(setCurrentUploadId(null));
        dispatch(setCurrentSampleId(id));
        dispatch(setEditingSampleId(id));
        onSelectUpload();
    }

    onCurrentUploadIdChange(id) {
        const {changeShowValues, dispatch, onSelectUpload} = this.props;
        changeShowValues(false);
        dispatch(setCurrentUploadId(id));
        dispatch(setCurrentSampleId(null));
        dispatch(setEditingSampleId(null));
        onSelectUpload();
    }
}

FileUploadLeftPane.propTypes = {
    changeShowValues: React.PropTypes.func.isRequired
};
