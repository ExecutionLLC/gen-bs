import React, {Component} from 'react';

import _ from 'lodash';
import FileUploadSamplesRow from './FileUploadSamplesRow';
import {entityType} from '../../../utils/entityTypes';

export default class FileUploadSamples extends Component {
    constructor(...args) {
        super(...args);
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
        const {samplesList, editableFieldsList} = props;
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
            const sampleSearchValues = _.map(editableFieldsList, editableField => {
                const sampleEditableField = sampleFieldsHash[editableField.fieldId];
                return getSearchValue(editableField, sampleEditableField)
                    .toLocaleLowerCase();
            });
            sampleSearchValues.push(sample.fileName.toLocaleLowerCase());
            return {
                sampleId: sample.id,
                searchValues: sampleSearchValues
            };
        });
        return _.keyBy(sampleSearchArray, 'sampleId');
    }

    getFilteredSamplesArray(samplesArray) {
        const searchWord = this.state.searchWord.toLocaleLowerCase();
        if (!searchWord) {
            return samplesArray;
        }
        return _.filter(samplesArray, sample => {
            const searchValues = this.state.samplesSearchHash[sample.id].searchValues;
            return _.some(searchValues, searchValue => searchValue.indexOf(searchWord) >= 0);
        });
    }

    render() {
        const {dispatch, closeModal, samplesList, editableFieldsList} = this.props;
        const {hashedArray: {array: samplesArray}} = samplesList;

        if (!editableFieldsList || !editableFieldsList.length) {
            console.error('No editable fields found');
            return null;
        }
        const filteredSamples = this.getFilteredSamplesArray(samplesArray);
        return (
            <div>
                <div className='navbar navbar-search-full'>
                    <div className='navbar-search'>
                        <div className='navbar-search-field'>
                            <input type='text' placeholder='Search available samples'
                                   onChange={e => this.setState({searchWord: e.target.value})}
                                   className='form-control material-input'/>
                        </div>
                    </div>
                </div>
                <div className='panel-group panel-group-scroll'>
                    {filteredSamples.map(
                        sample => (
                            sample.type !== entityType.HISTORY && <FileUploadSamplesRow
                                sampleId={sample.id}
                                isDemoSession={this.props.auth.isDemo}
                                fields={editableFieldsList}
                                key={sample.id}
                                samplesList={samplesList}
                                dispatch={dispatch}
                                closeModal={closeModal}
                            />
                        )
                    )}
                </div>
            </div>
        );
    }
}
