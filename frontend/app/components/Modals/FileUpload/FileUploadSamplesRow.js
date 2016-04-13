import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Panel} from 'react-bootstrap';

import SampleEditableFieldsPanel from './SampleEditableFieldsPanel';

import {
    changeSample, receiveSamplesList
} from '../../../actions/samplesList'


export default class FileUploadSamplesRow extends Component {

    constructor(...args) {
        super(...args);
        this.state = {showValues: false};
    }

    onSelectForAnalyzisClick(e, sample) {
        e.preventDefault();
        const {dispatch, closeModal, samplesList: {samples}} = this.props;
        dispatch(receiveSamplesList(samples));
        dispatch(changeSample(sample.id));
        closeModal('upload');
    }

    setShowValuesState(showValues) {
        this.setState({
            showValues
        });
    }

    onShowValuesClick(e) {
        e.preventDefault();
        this.setShowValuesState(!this.state.showValues);
    }

    render() {
        return (
            <div className="panel">
                {this.renderHeader()}
                {this.renderEditableValues()}
                {this.renderFooter()}
            </div>
        );
    }

    renderHeader() {
        const {sample} = this.props;
        return (
            <div>
                <div className="panel-heading">
                    <h3 className="panel-title">{sample.fileName}<span>{sample.description}</span></h3>
                </div>
            </div>
        );
    }

    renderFooter() {
        const {sample} = this.props;
        return (
            <div className="panel-footer">

                <a onClick={(e) => this.onSelectForAnalyzisClick(e, sample)}
                   className="btn btn-link btn-uppercase"
                   type="button">
                    <span data-localize="samples.settings.select.title">Select for analysis</span>
                </a>
                {sample.type === 'user'
                && <a onClick={e => this.onShowValuesClick(e)}
                      className="btn btn-link btn-uppercase" role="button"
                      data-toggle="collapse" data-parent="#accordion"
                      href="#collapseOne" aria-expanded="false"
                      aria-controls="collapseOne">Edit
                </a>}
            </div>
        );
    }


    renderEditableValues() {
        const {dispatch, fields, samplesList: {editedSamples}, sample} = this.props;
        return (
            <SampleEditableFieldsPanel dispatch={dispatch}
                                       isExpanded={this.state.showValues}
                                       fields={fields}
                                       sample={sample}
                                       editedSamples={editedSamples}
            />
        )
    }
}

function mapStateToProps(state) {
    const {ui, samplesList} = state;
    return {
        ui,
        samplesList
    }
}

export default connect(mapStateToProps)(FileUploadSamplesRow)