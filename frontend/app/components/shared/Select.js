import React, {Component} from 'react';
import OriginalSelect from 'react-select';

// Wrapper around react-select to define adequate defaults.
export default class Select extends Component {
    render() {
        const selectProperties = Object.assign({}, {
            clearable: false,
            backspaceRemoves: false
        }, this.props);

        return (
            <OriginalSelect
                {...selectProperties}
                matchProp='label'
                autosize={false}
            />
        );
    }
}
