import {Component} from 'react';
import shallowCompare from 'react-addons-shallow-compare';

export default class ComponentBase extends Component {
    shouldComponentUpdate(nextProps) {
        return shallowCompare(this.props, nextProps);
    }
}