import React from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import AnalysisHeader from './Analysis/AnalysisHeader';
import AnalysisBody from './Analysis/AnalysisBody';
import HistoryItemUtils from '../../utils/HistoryItemUtils';

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
                    editingHistoryList={this.props.editingHistoryList}
                    historyListFilter={this.props.historyListFilter}
                    newListItem={this.props.newListItem}
                    isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                    viewsList={this.props.viewsList}
                    filtersList={this.props.filtersList}
                    samplesList={this.props.samplesList}
                    modelsList={this.props.modelsList}
                />
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal();
    }
}

function mapStateToProps(state) {
    const {auth, queryHistory, viewsList, filtersList, samplesList} = state;

    const modelsList = {
        models: filtersList.hashedArray.array,
        selectedModelId: filtersList.selectedFilterId

    };
    
    const historyList = queryHistory.history.map((historyItem) => HistoryItemUtils.makeHistoryListItem(historyItem));

    return {
        auth,
        viewsList,
        filtersList,
        samplesList,
        modelsList,
        historyList,
        editingHistoryList: queryHistory.editingHistory,
        historyListFilter: queryHistory.filter,
        isHistoryReceivedAll: queryHistory.isReceivedAll,
        newListItem: HistoryItemUtils.makeNewListItem(samplesList, filtersList, viewsList)
    };
}

export default connect(mapStateToProps)(AnalysisModal);
