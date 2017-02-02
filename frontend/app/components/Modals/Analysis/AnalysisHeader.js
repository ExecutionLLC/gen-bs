import React from 'react';
import {Modal} from 'react-bootstrap';


export default class AnalysisHeader extends React.Component {
    render() {
        const {showAnalysisHide, onAnalysisHide, p} = this.props;

        return (
            <Modal.Header closeButton>
                <Modal.Title>
                    {showAnalysisHide && <button
                        className='btn btn-link-inverse btn-back-to-left'
                        type='button'
                        id='backToSplitLeftAn'
                        onClick={onAnalysisHide}
                    ><i className='md-i'>keyboard_backspace</i></button>
                    }
                    <span className='modal-title-text'
                          data-localize='query.title'>{p.t('analysis.title')}</span>
                </Modal.Title>
            </Modal.Header>
        );
    }
}
