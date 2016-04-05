import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';
import Select from 'react-select';
import { changeSample} from '../../../actions/ui';


export default class MetadataSearch extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {samples, currentSampleId, onSampleChangeRequested} = this.props;
        return (

            <div className="table-cell max-width">
                <div className="btn-group sample-search"
                     data-localize="samples.help"
                     data-toggle="tooltip"
                     data-placement="bottom"
                     data-container="body"
                     title="Select one from available samples"
                >
                    <Select options={samples.map( s => { return {value: s.id, label: s.fileName} } )}
                            clearable={false}
                            value={currentSampleId}
                            onChange={ (item) => onSampleChangeRequested(item.value)}
                    />
                </div>
            </div>
        );
    }
}

MetadataSearch.propTypes = {
    samples: React.PropTypes.array.isRequired,
    currentSampleId: React.PropTypes.string,
    // callback(sampleId)
    onSampleChangeRequested: React.PropTypes.func.isRequired
};
