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

    renderProgress(stage, stagesCount, progress) {
        return this.renderBar('Files processing', 100 * ((stage + progress / 100) / stagesCount));
    }

    render() {
        const { progressStatusFromAS, progressValueFromAS } = this.props;

        const STAGES = {
            TOTAL: 3,
            'ajax': 0,
            'converting': 1,
            's3_uploading': 2,
            'ready': 3
        };

        const currentStage = STAGES[progressStatusFromAS];
        if (currentStage == null) {
            return null;
        }
        const currentProgress = currentStage < STAGES.TOTAL ? progressValueFromAS : 0;
        return this.renderProgress(currentStage, STAGES.TOTAL, currentProgress);
    }
}
