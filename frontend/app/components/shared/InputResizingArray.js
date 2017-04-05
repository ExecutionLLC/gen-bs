import React, {Component} from 'react';
import Input from './Input';

function makeKeyForValueIndex(v, i) {
    return 'key_' + v + '/' + i;
}

export default class InputResizingArray extends Component {

    static toKeyed(vals) {
        return vals.map( (v, i) => ({val: v, key: makeKeyForValueIndex(v, i)}) );
    }

    static addEmpty(vals) {
        return vals.concat([{val: '', key: makeKeyForValueIndex('', vals.length)}]);
    }

    static fromKeyed(vals) {
        return vals.map((v) => v.val);
    }

    static removeEmpty(vals) {
        return vals.filter((v) => v.val !== '');
    }

    static makeInputProps(props) {
        return _.omit(props, ['value', 'InputComponent', 'onChange']);
    }

    static DefaultInput(props) {
        return (
            <Input {...props} />
        );
    }

    onEditIndex(val, index, isComplete) {
        var arr = this.state.value.slice();
        const isValEmpty = val === '';
        const isIndexTail = index >= this.state.value.length - 1;
        arr[index].val = val;
        if (isValEmpty) {
            if (!isIndexTail && isComplete) {
                arr.splice(index, 1);
            }
        } else {
            if (isIndexTail) {
                arr = InputResizingArray.addEmpty(arr);
            }
        }
        this.setState({value: arr});
        if (isComplete) {
            this.props.onChange(InputResizingArray.fromKeyed(InputResizingArray.removeEmpty(arr)));
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            value: InputResizingArray.addEmpty(InputResizingArray.removeEmpty(InputResizingArray.toKeyed(props.value)))
        };
    }

    componentWillReceiveProps(newProps) {
        this.state = {
            value: InputResizingArray.addEmpty(InputResizingArray.removeEmpty(InputResizingArray.toKeyed(newProps.value)))
        };
    }

    render() {
        const InputComponent = this.props.InputComponent || InputResizingArray.DefaultInput;

        return (
            <div>
                {this.state.value.map((val, i) => {
                    return (
                        <InputComponent
                            key={val.key}
                            {...InputResizingArray.makeInputProps(this.props)}
                            value={val.val}
                            onChange={ (val) => this.onEditIndex(val, i, true) }
                            onChanging={ (val) => this.onEditIndex(val, i, false) }
                        />
                    );
                })}
            </div>
        );
    }
}
