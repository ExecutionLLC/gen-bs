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
                    historyListFilter={this.props.historyListFilter}
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

function makeHistoryListItem(historyItem) {
    const name = historyItem.timestamp + '_' + historyItem.sample.fileName + '_' + historyItem.filters[0].name + '_' + historyItem.view.name;
    return {
        id: historyItem.id,
        name: name,
        description: 'Description of ' + name,
        createdDate: historyItem.timestamp,
        lastQueryDate: historyItem.timestamp + 1000,
        filter: historyItem.filters[0],
        view: historyItem.view,
        type: {
            single: {
                sample: historyItem.sample
            }
/* TODO: make other types like this:
            tumorNormal: {
                samples: {
                    tumor: historyItem.sample,
                    normal: historyItem.sample
                },
                model: historyItem.filters[0]
            }

            family: {
                samples: {
                    proband: historyItem.sample,
                    members: [
                        {memberId: 'father', sample: historyItem.sample},
                        {memberId: 'mother', sample: historyItem.sample}
                    ]
                },
                model: historyItem.filters[0]
            }
*/
        }
    };
}

function mapStateToProps(state) {
    const {auth, queryHistory, viewsList, filtersList, samplesList} = state;

    const modelsList = {
        models: filtersList.hashedArray.array,
        selectedModelId: filtersList.selectedFilterId

    };
    
    const historyList = queryHistory.history.map((historyItem) => makeHistoryListItem(historyItem));

    return {
        auth,
        viewsList,
        filtersList,
        samplesList,
        modelsList,
        historyList,
        historyListFilter: queryHistory.filter,
        isHistoryReceivedAll: queryHistory.isReceivedAll
    };
}

export default connect(mapStateToProps)(AnalysisModal);
