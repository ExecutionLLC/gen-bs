import React from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import AnalysisHeader from './Analysis/AnalysisHeader';
import AnalysisBody from './Analysis/AnalysisBody';


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
                    historyListSearch={this.props.historyListSearch}
                    currentHistoryId={this.props.currentHistoryId}
                    newHistoryItem={this.props.newHistoryItem}
                    isHistoryReceivedAll={this.props.isHistoryReceivedAll}
                    isHistoryRequesting={this.props.isHistoryRequesting}
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
    const {auth, analysesHistory, viewsList, filtersList, modelsList, samplesList, fields} = state;

    
    const historyList = analysesHistory.history;
    const initialHistoryList = analysesHistory.initialHistory;

    const newHistoryItem = analysesHistory.newHistoryItem;

    return {
        auth,
        viewsList,
        filtersList,
        samplesList,
        modelsList,
        historyList,
        initialHistoryList,
        fields,
        historyListSearch: analysesHistory.search,
        currentHistoryId: analysesHistory.currentHistoryId,
        isHistoryReceivedAll: analysesHistory.isReceivedAll,
        isHistoryRequesting: analysesHistory.isRequesting,
        newHistoryItem,
        isLoadingHistoryData: analysesHistory.isLoadingHistoryData
    };
}

export default connect(mapStateToProps)(AnalysisModal);
