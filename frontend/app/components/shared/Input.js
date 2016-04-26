import React, {Component} from 'react';

/**
 * Input field component with on blur and on enter firing onChange
 */
export default class Input extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value
        };
    }

    componentWillReceiveProps(newProps) {
        this.state = {
            value: newProps.value
        };
    }

    render() {
        const value = this.state.value;
        const {onChange, onChanging} = this.props;

        return (
            <input
                {...this.props}
                value={value}
                onChange={ (evt) => { const value = evt.target.value; this.setState({value: value}); if (onChanging) onChanging(value); } }
                onBlur={ (evt) => onChange(evt.target.value) }
                onKeyDown={ (evt) => { if (evt.keyCode == 13) onChange(value) } }
            />
        );
    }
}

/**
 * Example:

 class App extends Component {
  render() {
    return (
      <div>
        <Input
          className="i1"
          type="number"
          value={1234}
          onChange={ (val) => { console.log(val); } }
        />
      </div>
    );
  }
}

 */
