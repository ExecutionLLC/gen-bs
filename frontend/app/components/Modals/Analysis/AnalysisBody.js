import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';


export default class AnalysisBody extends React.Component {

    constructor(props) { // TODO: rid of the state
        super(props);
        this.state = {
            currentHistoryItemId: props.queryHistory.history[0].id
        }
    }

    render() {
        const selectedHistoryItem = this.findHistoryItemForId(this.state.currentHistoryItemId);
        const editingHistoryItem = selectedHistoryItem ? {
            name: selectedHistoryItem.timestamp + '_' + selectedHistoryItem.sample.fileName + '_' + selectedHistoryItem.filters[0].name + '_' + selectedHistoryItem.view.name,
            description: '<description>',
            createdDate: selectedHistoryItem.timestamp,
            lastQueryDate: '<last query date>'
        } : {
            name: '<name>',
            description: '<description>',
            createdDate: '<created date>',
            lastQueryDate: '<last query date>'
        };
        
        return (
            <Modal.Body>
                <div className='split-layout'>
                    <div className='split-left'>
                        <div className='split-wrap'>
                            <AnalysisLeftPane
                                queryHistory={this.props.queryHistory}
                                currentItemId={this.state.currentHistoryItemId}
                                onSelectHistory={(id) => this.onSelectHistoryId(id)}
                            />
                        </div>
                    </div>
                    <div className='split-right tab-content'>
                        <div className='split-wrap tab-pane active'>
                            <AnalysisRightPane
                                auth={this.props.auth}
                                historyItem={editingHistoryItem}
                                viewsList={this.props.viewsList}
                                filtersList={this.props.filtersList}
                                samplesList={this.props.samplesList}
                                modelsList={this.props.modelsList}
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        );
    }

    findHistoryItemForId(id) {
        return this.props.queryHistory.history.find((historyItem) => historyItem.id === id)
    }

    onSelectHistoryId(id) {
        this.setState({currentHistoryItemId: id})
    }
}
