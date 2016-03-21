import React, { Component } from 'react';
import Select2 from 'react-select2-wrapper';
import Select from 'react-select';
import { changeSample} from '../../../actions/ui'


export default class MetadataSearch extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        const samples = this.props.userData.samples
        const currentSample = this.props.ui.currentSample
        const dispatch = this.props.dispatch
        return (

            <div className="table-cell max-width">
                <div className="btn-group sample-search" data-localize="samples.help" data-toggle="tooltip"
                     data-placement="bottom" data-container="body" title="Select one from available samples">
                    <Select
                        options={samples.map( s => { return {value: s.id, label: s.file_name} } )}
                        clearable={false}
                        value={currentSample ? currentSample.id: null}
                        onChange={ (val) => dispatch(changeSample(samples,val.value) )}
                    />
                </div>
            </div>

        )
    }
}
