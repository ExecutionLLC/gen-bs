import Moment from 'moment';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';

import {renewHistoryItem} from '../../actions/queryHistory'

export default class QueryHistoryModal extends Component {
    renderHeader() {
        return (
            <Modal.Header closeButton>
                <Modal.Title data-localize='history.heading'>
                    History
                </Modal.Title>
            </Modal.Header>
        )
    }

    renderHistoryTableHeader() {
        return (
            <thead>
            <tr>
                <th data-localize='general.datetime'>
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

    renderEmptyHistoryTableBody() {
        const {isDemo} = this.props;
        const message = isDemo ? "Please register to access your query history." : "History is empty.";
        return (
            <tr>
                <td colSpan='5'>
                    <div className='empty'><h3><i className='md-i'>hourglass_empty</i>{message}</h3></div>
                </td>
            </tr>
        )
    }

    renderHistoryTableBody() {
        const history = this.props.history;
        if (history.length === 0) {
            return (
                <tbody>
                { this.renderEmptyHistoryTableBody() }
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
            <button className='btn btn-uppercase btn-link'
                    onClick={ () => { this.onRenewButtonClicked(historyItemId) } }
            >
                Renew
            </button>
        )
    }

    renderHistoryTableRow(historyItem) {
        const itemId = historyItem.id;
        const datetime = historyItem.timestamp ? Moment(historyItem.timestamp).format('YYYY-MM-DD-HH-mm-ss') : 'Unknown';
        const sample = historyItem.sample ? historyItem.sample.fileName : 'Unknown';
        const filters = historyItem.filters.length > 0 ? _.map(historyItem.filters, (item) => {
            return item.name
        }).join('</br>') : 'Unknown';
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
            <table className='table table-condensed'>
                { this.renderHistoryTableHeader() }
                { this.renderHistoryTableBody() }
            </table>
        )
    }

    renderFooter() {
        return null;
    }

    render() {
        return (
            <Modal
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
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
        this.props.dispatch(renewHistoryItem(historyItemId));
        this.props.closeModal();
    }
}

function mapStateToProps(state) {
    const {auth: {isDemo}, queryHistory: {history}} = state;
    return {
        isDemo,
        history
    }
}

export default connect(mapStateToProps)(QueryHistoryModal);