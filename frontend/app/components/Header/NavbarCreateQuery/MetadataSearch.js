import React, { Component } from 'react';
import Select from '../../shared/Select';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';

export default class MetadataSearch extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {selectedSampleId, onSampleChangeRequested} = this.props;
        return (

            <div className='table-cell max-width'>
                <div className='btn-group sample-search'
                     data-localize='samples.help'
                     data-toggle='tooltip'
                     data-placement='bottom'
                     data-container='body'
                     title='Select one from available samples'
                >
                    <Select options={this.getSampleOptions()}
                            value={selectedSampleId}
                            onChange={ (item) => onSampleChangeRequested(item.value)}
                    />
                </div>
            </div>
        );
    }

    isSampleDisabled(sample) {
        const {isDemoSession} = this.props;
        return isDemoSession && sample.type == 'advanced';
    }

    getSampleOptions() {
        const {samplesArray} = this.props;
        return samplesArray.map((sampleItem) => {
            const isDisabled = this.isSampleDisabled(sampleItem);
            const label = getItemLabelByNameAndType(sampleItem.fileName, sampleItem.type);
            return {value: sampleItem.id, label, disabled: isDisabled};
        });
    }
}

MetadataSearch.propTypes = {
    samplesArray: React.PropTypes.array.isRequired,
    selectedSampleId: React.PropTypes.string,
    isDemoSession: React.PropTypes.bool.isRequired,
    /**
     * @type Function(Uuid sampleId)
     * */
    onSampleChangeRequested: React.PropTypes.func.isRequired
};
