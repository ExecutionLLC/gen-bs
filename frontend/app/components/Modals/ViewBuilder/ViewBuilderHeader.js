import React from 'react';
import {Modal} from 'react-bootstrap';


export default class ViewBuilderHeader extends React.Component {
    render() {
        const {p} = this.props;
        return (
            <Modal.Header closeButton>
                <Modal.Title>
                    {p.t('view.header.title')}
                </Modal.Title>
            </Modal.Header>
        );
    }
}
