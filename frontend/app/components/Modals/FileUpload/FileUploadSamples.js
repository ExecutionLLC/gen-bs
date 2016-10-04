import React, {Component} from 'react';

import _ from 'lodash';
import FileUploadSamplesRow from './FileUploadSamplesRow';
import {entityType} from '../../../utils/entityTypes';

export default class FileUploadSamples extends Component {
    constructor(...args) {
        super(...args);
        this.state = {searchWord: ''};
    }

    render() {
        const {dispatch, closeModal, samplesList, editableFieldsList} = this.props;
        const {hashedArray: {array: samplesArray}} = samplesList;
        const searchWord = this.state.searchWord.toLowerCase();

        if (!editableFieldsList || !editableFieldsList.length) {
            console.error('No editable fields found');
            return null;
        }
        const sampleSearchArray = _.map(samplesArray, sample => {
            const sampleFieldsHash = _.keyBy(sample.values, 'fieldId');
            const sampleSearchValues = _.map(editableFieldsList, editableField => {
                const sampleEditableField = sampleFieldsHash[editableField.fieldId];
                const searchValue = !_.isNull(sampleEditableField.values)
                        ? !_.isEmpty(editableField.availableValues)
                            ? _.find(editableField.availableValues, {'id': sampleEditableField.values}).value
                            : sampleEditableField.values
                        : '';

                return searchValue;
            });
            sampleSearchValues.push(sample.fileName);
            return {
                ...sample,
                searchValues: sampleSearchValues
            };
        });
        const filteredSamples = searchWord ?
            _.filter(sampleSearchArray, sample => {
                return _.some(sample.searchValues, searchValue => {
                    return searchValue.toLocaleLowerCase().indexOf(searchWord) >= 0;
                });
            }) : samplesArray;
        return (
            <div>
                <div className='navbar navbar-search-full'>
                    <div className='navbar-search'>
                        <div className='navbar-search-field'>
                            <input type='text' placeholder='Search available samples'
                                   onChange={e => this.setState({ searchWord: e.target.value })}
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
