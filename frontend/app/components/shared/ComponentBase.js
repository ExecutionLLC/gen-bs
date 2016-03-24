import React, {Component} from 'react';
import shallowCompare from 'react-addons-shallow-compare';

export default class ComponentBase extends Component {
    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this.props, nextProps);
    }
}