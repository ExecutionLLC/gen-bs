import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {Modal} from 'react-bootstrap';
import AnalysisHeader from './Analysis/AnalysisHeader';
import AnalysisBody from './Analysis/AnalysisBody';
import {getP} from 'redux-polyglot/dist/selectors';

class AnalysisModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isAnalysisBringToFront: false};
    }

    render() {
        const {showModal, p} = this.props;

        return (
            <Modal
                id='analysis-modal'
                dialogClassName='modal-dialog-primary modal-columns'
                bsSize='lg'
                show={showModal}
                onHide={() => this.onClose()}
                backdrop='static'
            >
                <AnalysisHeader
                    showAnalysisHide={this.state.isAnalysisBringToFront}
                    onAnalysisHide={() => this.onAnalysisHide()}
                    p={p}
                />
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
                    isAnalysisBringToFront={this.state.isAnalysisBringToFront}
                    onAnalysisShow={() => this.onAnalysisShow()}
                    p={p}
                />
            </Modal>
        );
    }

    onClose() {
        this.props.closeModal();
    }

    onAnalysisShow() {
        this.setState({isAnalysisBringToFront: true});
    }

    onAnalysisHide() {
        this.setState({isAnalysisBringToFront: false});
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
        isLoadingHistoryData: analysesHistory.isLoadingHistoryData,
        p: getP(state)
    };
}

AnalysisModal.propTypes = {
    p: PropTypes.shape({t: PropTypes.func.isRequired}).isRequired
};

export default connect(mapStateToProps)(AnalysisModal);
