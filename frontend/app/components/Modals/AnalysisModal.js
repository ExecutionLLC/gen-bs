import * as _ from 'lodash';

import React from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import AnalysisHeader from './Analysis/AnalysisHeader';
import AnalysisBody from './Analysis/AnalysisBody';
import HistoryItemUtils from '../../utils/HistoryItemUtils';
import {entityType} from '../../utils/entityTypes';


class AnalysisModal extends React.Component {
    render() {
        const {showModal} = this.props;

        return (
            <Modal
                id='analysis-modal'
                dialogClassName='modal-dialog-primary'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
            >
                <AnalysisHeader />
                <AnalysisBody
                    dispatch={this.props.dispatch}
                    auth={this.props.auth}
                    historyList={this.props.historyList}
                    initialHistoryList={this.props.initialHistoryList}
                    editingHistoryList={this.props.editingHistoryList}
                    historyListFilter={this.props.historyListFilter}
                    currentHistoryId={this.props.currentHistoryId}
                    newHistoryItem={this.props.newHistoryItem}
                    isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                    viewsList={this.props.viewsList}
                    filtersList={this.props.filtersList}
                    samplesList={this.props.samplesList}
                    modelsList={this.props.modelsList}
                    fields={this.props.fields}
                />
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal();
    }
}

function mapStateToProps(state) {
    const {auth, queryHistory, viewsList, filtersList, samplesList, fields} = state;

    const modelsList = {
        hashedArray: filtersList.hashedArray
    };
    
    const historyList = queryHistory.history;
    const initialHistoryList = queryHistory.initialHistory;

    function findFirstNonHistoryItem(list) {
        return _.find(list.hashedArray.array, (item) => item.type !== entityType.HISTORY);
    }

    const newHistoryItem = queryHistory.newHistoryItem || HistoryItemUtils.makeNewHistoryItem(
            findFirstNonHistoryItem(samplesList),
            findFirstNonHistoryItem(filtersList),
            findFirstNonHistoryItem(viewsList)); // TODO also check for available for user items

    return {
        auth,
        viewsList,
        filtersList,
        samplesList,
        modelsList,
        historyList,
        initialHistoryList,
        fields,
        editingHistoryList: queryHistory.editingHistory,
        historyListFilter: queryHistory.filter,
        currentHistoryId: queryHistory.currentHistoryId,
        isHistoryReceivedAll: queryHistory.isReceivedAll,
        newHistoryItem,
        isLoadingHistoryData: queryHistory.isLoadingHistoryData
    };
}

export default connect(mapStateToProps)(AnalysisModal);
