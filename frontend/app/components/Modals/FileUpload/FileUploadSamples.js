import React, { Component } from 'react';

import { changeSample, updateSampleValue } from '../../../actions/ui'

import FileUploadSamplesRow from './FileUploadSamplesRow';

export default class FileUploadSamples extends Component {
    constructor(...args) {
        super(...args);
        this.state = {searchWord: ''};
    }

    render() {
        let { samples,dispatch, closeModal } = this.props;
        if (!this.props.editableFieldsList || !this.props.editableFieldsList.length) {
            console.error('No editable fields found');
            return null;
        }
        if (this.state.searchWord.length > 0) {
            let searchWord = this.state.searchWord.toLowerCase();
            samples = samples.filter(el => ~el.file_name.toLocaleLowerCase().indexOf(searchWord));
        }
        return (
            <div>
                <div className="navbar navbar-search-full">
                    <div className="navbar-search">
                        <div className="navbar-search-field">
                          <input type="text" placeholder="Search available samples" onChange={e => this.setState({ searchWord: e.target.value })}
                               className="form-control material-input"/>
                        </div>
                    </div>
                </div>
                <div className="panel-group panel-group-scroll">
                    {samples.map(
                        sample => (
                            <FileUploadSamplesRow
                                sample={sample}
                                fields={this.props.editableFieldsList}
                                key={sample.id}
                                samples={samples}
                                dispatch={dispatch}
                                closeModal={closeModal}
                                onUpdateSampleValue={(valueFieldId, value) => dispatch(updateSampleValue(sample.id, valueFieldId, value))}
                            />
                        )
                    )}
                </div>
            </div>
        );
    }
}