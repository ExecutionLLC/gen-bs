import React, {Component} from 'react';
import {ProgressBar} from 'react-bootstrap';

export default class FileUploadProgressBar extends Component {

    renderBar(title, now) {
        return (
            <div>
                <div className='text-center'><strong>{title}</strong></div>
                <ProgressBar now={now} label='%(percent)s%' bsStyle='success' />
            </div>
        );
    }

    render() {
        const { progressStatus, progressValue } = this.props;

        const STAGES = {
            TOTAL: 2,
            'ajax': 0,
            'task_running': 1
        };

        const currentStage = STAGES[progressStatus];
        if (!currentStage && currentStage !== 0) {
            return null;
        }
        return this.renderBar('Your file is being processed...',
            Math.round((currentStage * 100 + progressValue) / STAGES.TOTAL)
        );
    }
}
