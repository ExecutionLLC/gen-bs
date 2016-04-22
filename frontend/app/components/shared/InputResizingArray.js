import React, {Component} from 'react';
import Input from './Input';

const makeKey = (function() {
    var key;
    return function() {
        key = (key + 1) || 0;
        return key;
    };
})();

export default class InputResizingArray extends Component {

    static toKeyed(vals) {
        return vals.map( (v) => ({val: v, key: makeKey()}) );
    }

    static addEmpty(vals) {
        return vals.concat([{val: '', key: makeKey()}]);
    }

    static fromKeyed(vals) {
        return vals.map( (v) => v.val );
    }

    static removeEmpty(vals) {
        return vals.filter( (v) => v.val !== '' );
    }

    static DefaultInput(props) {
        return (
            <Input {...props} />
        );
    }

    constructor(props) {
        super(props);
        this.state = {
            value: InputResizingArray.addEmpty(InputResizingArray.toKeyed(props.value))
        };
    }

    render() {
        const InputComponent = this.props.InputComponent || InputResizingArray.DefaultInput;

        const self = this;

        function onEditIndex(val, index) {
            var arr = self.state.value.slice();
            const isValEmpty = val === '';
            const isIndexTail = index >= self.state.value.length - 1;
            arr[index].val = val;
            if (isValEmpty) {
                if (!isIndexTail) {
                    arr.splice(index, 1);
                }
            } else {
                if (isIndexTail) {
                    arr = InputResizingArray.addEmpty(arr);
                }
            }
            self.setState({value: arr});
            self.props.onChange(InputResizingArray.fromKeyed(InputResizingArray.removeEmpty(arr)));
        }

        return (
            <div>
                {this.state.value.map( (val, i) => {
                    return (
                        <InputComponent key={val.key} {...this.props} value={val.val} onChange={ (val) => onEditIndex(val, i) } />
                    );
                })}
            </div>
        );
    }
}
