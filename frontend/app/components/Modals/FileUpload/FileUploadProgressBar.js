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
            'ajax': {start: 10, length: 0},
            'task_running': {start: 10, length: 90}
        };

        const currentStage = STAGES[progressStatus];
        if (!currentStage) {
            return null;
        }
        return this.renderBar('Your file is being processed...',
            Math.round(currentStage.start + currentStage.length * progressValue / 100)
        );
    }
}
