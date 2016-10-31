import React from 'react';
import FileUploadSampleSearch from './FileUploadSampleSearch';
import FileUploadSampleList from './FileUploadSampleList';

import {
    setCurrentSampleId
} from '../../../actions/samplesList';
import {setCurrentUploadId} from '../../../actions/fileUpload';

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
            if (_.isNull(sampleEditableFieldValue.values)) {
                return '';
            }
            if (_.isEmpty(editableField.availableValues)) {
                return sampleEditableFieldValue.values;
            }
            return _.find(editableField.availableValues, {'id': sampleEditableFieldValue.values}).value;
        }

        const sampleSearchArray = _.map(samplesArray, sample => {
            const sampleFieldsHash = _.keyBy(sample.values, 'fieldId');
            const sampleSearchValues = _.map(editableFields, editableField => {
                const sampleEditableField = sampleFieldsHash[editableField.fieldId];
                return getSearchValue(editableField, sampleEditableField)
                    .toLocaleLowerCase();
            });
            sampleSearchValues.push(sample.fileName ? sample.fileName.toLocaleLowerCase() : '???');
            return {
                sampleId: sample.id,
                searchValues: sampleSearchValues
            };
        });
        return _.keyBy(sampleSearchArray, 'sampleId');
    }

    render() {
        const { samplesList, fileUpload, currentSampleId, currentHistorySamplesIds} = this.props;
        const {searchWord, samplesSearchHash} = this.state;

        return (
            <div className='split-left'>
                <FileUploadSampleSearch
                    search={searchWord}
                    onSearch={(e) => this.onSampleSearchChange(e)}
                />
                <FileUploadSampleList
                    sampleList={samplesList}
                    currentSampleId={currentSampleId}
                    onSelectSample={(id) => this.onCurrentSampleIdChange(id)}
                    onSelectUpload={(id) => this.onCurrentUploadIdChange(id)}
                    fileUpload={fileUpload}
                    search={searchWord}
                    samplesSearchHash={samplesSearchHash}
                    currentHistorySamplesIds={currentHistorySamplesIds}
                />
            </div>
        );
    }

    onSampleSearchChange(str) {
        this.setState({searchWord: str});
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

FileUploadLeftPane.propTypes = {
    changeShowValues: React.PropTypes.func.isRequired
};
