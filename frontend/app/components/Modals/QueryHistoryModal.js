import React, {Component} from 'react';
import { Modal } from 'react-bootstrap';

export default class QueryHistoryModal extends Component {
    renderHeader() {
        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize="history.heading">
                    History
                </Modal.Title>
            </Modal.Header>
        )
    }

    renderHistoryTableHeader() {
        return (
            <thead>
                <tr>
                    <th data-localize="general.datetime">
                        Datetime
                    </th>
                    <th>
                        Filters
                    </th>
                    <th>
                        View
                    </th>
                    <th></th>
                </tr>
            </thead>
        )
    }

    renderHistoryTableBody() {
        return (
            <tbody>
            </tbody>
        )
    }

    renderHistoryTableRow() {

    }

    renderHistoryTable() {
        return (
            <table className="table table-condensed">
                { this.renderHistoryTableHeader() }
                { this.renderHistoryTableBody() }
            </table>
        )
    }

    renderFooter() {
        return (
            <Modal.Footer>
            </Modal.Footer>
        )
    }

    render() {
        return (
            <Modal
                dialogClassName="modal-dialog-primary"
                bsSize="lg"
                show={ this.props.showModal }
                onHide={ () => {this.props.closeModal('queryHistory')} }
            >
                { this.renderHeader() }
                { this.renderHistoryTable() }
                { this.renderFooter() }
            </Modal>
        )
    }
}