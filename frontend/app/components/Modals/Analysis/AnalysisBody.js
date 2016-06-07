import React from 'react';
import {Modal} from 'react-bootstrap';
import AnalysisLeftPane from './AnalysisLeftPane';
import AnalysisRightPane from './AnalysisRightPane';


export default class AnalysisBody extends React.Component {
    render() {
        const selectedHistoryItem = this.props.queryHistory.history[0];
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
                            />
                        </div>
                    </div>
                    <div className='split-right tab-content'>
                        <div className='split-wrap tab-pane active'>
                            <AnalysisRightPane
                                auth={this.props.auth}
                                historyItem={editingHistoryItem}
                                viewsList={this.props.viewsList}
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        );
    }
}
