import React, {Component} from 'react';
import InputResizingArray from './InputResizingArray';

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
            var arr = self.state.value.slice();
            arr[index].val = val;
            self.setState({value: arr});
            self.props.onChange(InputResizingArray.fromKeyed(arr));
        }

        return (
            <div>
                {this.state.value.map( (val, i) => {
                    return (
                        <InputComponent key={val.key} {...this.props} value={val.val} onChange={(val) => onEditIndex(val, i)} />
                    );
                })}
            </div>
        );
    }
}
