import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';
import Select from 'react-select';


export default class MetadataSearch extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {samples, selectedSampleId, onSampleChangeRequested} = this.props;
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
                            value={selectedSampleId}
                            onChange={ (item) => onSampleChangeRequested(item.value)}
                    />
                </div>
            </div>
        );
    }
}

MetadataSearch.propTypes = {
    samples: React.PropTypes.array.isRequired,
    selectedSampleId: React.PropTypes.string,
    /**
     * @type Function(Uuid sampleId)
     * */
    onSampleChangeRequested: React.PropTypes.func.isRequired
};
