import React, {Component, PropTypes} from 'react';

/**
 * Input field component with on blur and on enter firing onChange
 */
export default class Input extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            changed: false
        };
    }

    componentWillReceiveProps(newProps) {
        if (!this.state.changed) {
            this.state = {
                value: newProps.value,
                changed: false
            };
        }
    }

    render() {
        const value = this.state.value;
        return (
            <input
                {...this.props}
                value={value}
                onChange={ (evt) => this.onInputChanged(evt) }
                onBlur={ (evt) => this.onInputBlur(evt) }
                onKeyDown={ (evt) => this.onInputKeyDown(evt)  }
            />
        );
    }

    onInputBlur(evt) {
        const {onChange} = this.props;
        this.setState({changed: false});
        onChange(evt.target.value);
    }

    onInputKeyDown(evt) {
        if (evt.keyCode !== 13) {
            return;
        }

        const {value} = this.state;
        const {onChange} = this.props;
        onChange(value);
    }

    onInputChanged(evt) {
        const {onChanging, validationRegex} = this.props;
        const value = evt.target.value;
        if (validationRegex && !new RegExp(validationRegex).test(value)){
            return;
        }
        this.setState({value, changed: true});

        if (onChanging) {
            onChanging(value);
        }
    }

    static propTypes = {
        /**
         * @type function(string)
         */
        onChange: PropTypes.func.isRequired,
        /**
         * @type function(string)
         */
        onChanging: PropTypes.func
    };
}

/**
 * Example:

 class App extends Component {
  render() {
    return (
      <div>
        <Input
          className='i1'
          type='number'
          value={1234}
          onChange={ (val) => { console.log(val); } }
        />
      </div>
    );
  }
}

 */
