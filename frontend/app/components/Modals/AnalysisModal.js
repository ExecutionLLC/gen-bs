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
                    auth={this.props.auth}
                    queryHistory={this.props.queryHistory}
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

    return {
        auth,
        queryHistory,
        viewsList,
        filtersList,
        samplesList,
        modelsList
    };
}

export default connect(mapStateToProps)(AnalysisModal);
