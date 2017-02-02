import React, {Component} from 'react';
import {Modal} from 'react-bootstrap';


export default class FilterBuilderHeader extends Component {
    render() {
        const {texts, p} = this.props;

        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize='filters.heading'>
                    {p.t('filterAndModel.header.title')} {texts.Filters}
                </Modal.Title>
            </Modal.Header>
        );
    }
}
