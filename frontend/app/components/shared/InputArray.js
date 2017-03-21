import React, {Component} from 'react';
import InputResizingArray from './InputResizingArray';

import immutableArray from '../../utils/immutableArray';


export default class InputArray extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: InputResizingArray.toKeyed(props.value)
        };
    }

    componentWillReceiveProps(newProps) {
        this.state = {
            value: InputResizingArray.toKeyed(newProps.value)
        };
    }

    render() {
        const InputComponent = this.props.InputComponent || InputResizingArray.DefaultInput;

        const self = this;

        function onEditIndex(val, index) {
            const arr = immutableArray.assign(self.state.value, index, {val});
            self.setState({value: arr});
            self.props.onChange(InputResizingArray.fromKeyed(arr));
        }

        return (
            <div>
                {this.state.value.map((val, i) => {
                    return (
                        <InputComponent
                            key={val.key}
                            {...InputResizingArray.makeInputProps(this.props)}
                            value={val.val}
                            onChange={(val) => onEditIndex(val, i)}
                        />
                    );
                })}
            </div>
        );
    }
}
