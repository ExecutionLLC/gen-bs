import React, {Component} from 'react';

import FileUploadSamplesRow from './FileUploadSamplesRow';
import {entityType} from '../../../utils/entityTypes';

export default class FileUploadSamples extends Component {
    constructor(...args) {
        super(...args);
        this.state = {searchWord: ''};
    }

    render() {
        const {dispatch, closeModal, samplesList} = this.props;
        const {hashedArray: {array: samplesArray}} = samplesList;
        const searchWord = this.state.searchWord.toLowerCase();

        if (!this.props.editableFieldsList || !this.props.editableFieldsList.length) {
            console.error('No editable fields found');
            return null;
        }
        const filteredSamples = searchWord ?
            samplesArray.filter((sample) => sample.fileName.toLocaleLowerCase().indexOf(searchWord) >= 0) :
            samplesArray;
        debugger;
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
                                fields={this.props.editableFieldsList}
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
