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
            TOTAL: 3,
            'ajax': 0,
            'converting': 1,
            's3_uploading': 2,
            'ready': 3
        };

        const currentStage = STAGES[progressStatus];
        if (currentStage == null) {
            return null;
        }
        const currentProgress = currentStage < STAGES.TOTAL ? progressValue : 0;
        return this.renderBar('Files processing', Math.round(100 * ((currentStage + currentProgress / 100) / STAGES.TOTAL)));
    }
}
