import React, {Component} from 'react';
import { connect } from 'react-redux';
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
                        Sample
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
        const history = this.props.history;
        if (history.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td collspan="5">
                            History is empty.
                        </td>
                    </tr>
                </tbody>
            )
        }
        return (
            <tbody>
                { _.map(history, (historyItem) => this.renderHistoryTableRow(historyItem)) }
            </tbody>
        )
    }

    renderRenewButton(historyItemId) {
        return (
            <button className="btn btn-uppercase btn-link"
                    onClick={ () => { this.onRenewButtonClicked(historyItemId) } }
            >
                Renew
            </button>
        )
    }

    renderHistoryTableRow(historyItem) {
        const itemId = historyItem.id;
        const datetime = historyItem.timestamp ? (new Date(historyItem.timestamp)).toString() : 'Unknown';
        const sample = historyItem.sample ? historyItem.sample.fileName : 'Unknown';
        const filters = historyItem.filters.length > 0 ? _.map(historyItem.filters, (item) => { return item.name }).join('</br>') : 'Unknown';
        const view = historyItem.view ? historyItem.view.name : 'Unknown';
        return (
            <tr key={ itemId }>
                <td>{ datetime }</td>
                <td>{ sample }</td>
                <td>{ filters }</td>
                <td>{ view }</td>
                <td>{ this.renderRenewButton(historyItem.id) }</td>
            </tr>
        )
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
                onHide={ () => {this.props.closeModal()} }
            >
                { this.renderHeader() }
                { this.renderHistoryTable() }
                { this.renderFooter() }
            </Modal>
        )
    }

    onRenewButtonClicked(historyItemId) {
        console.log("onRenewButtonClicked", historyItemId);
    }
}

function mapStateToProps(state) {
    const { queryHistory: { history } } = state;
    return {
        history
    }
}

export default connect(mapStateToProps)(QueryHistoryModal);