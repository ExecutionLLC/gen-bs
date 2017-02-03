import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';


export default class FilterBuilderHeader extends Component {
    render() {
        const {texts} = this.props;

        return (
            <Modal.Header closeButton>
                <Modal.Title>
                    {texts.p('header')}
                </Modal.Title>
            </Modal.Header>
        );
    }
}
