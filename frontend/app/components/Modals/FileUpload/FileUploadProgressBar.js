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
            TOTAL: 1,
            'ajax': 0,
            'task_running': 1
        };

        const currentStage = STAGES[progressStatus];
        if (currentStage == null) {
            return null;
        }
        const currentProgress = currentStage < STAGES.TOTAL ? progressValue : 0;
        return this.renderBar('Your file is being processed...',
            Math.round(100 * ((currentStage + currentProgress / 100) / STAGES.TOTAL))
        );
    }
}
