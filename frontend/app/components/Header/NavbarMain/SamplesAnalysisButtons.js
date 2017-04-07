
import React, { Component } from 'react';
import Perf from 'react-addons-perf';

const ENABLE_PERFORMANCE_CONTROLS = false;

export class SamplesButton extends Component {

    render() {
        return (
            <div className='samples-analysis-wrapper'>
                <div>
                    <a
                        href='#'
                        className='btn navbar-btn'
                        type='button'
                        onClick={() => this.props.openSamplesModal()}
                    ><span
                        className='hidden-xs'
                    >{this.props.p.t('navBar.samplesButton')}</span><span className='visible-xs'><i className='ag22 ag-blood-test-3'></i></span>
                        {this.props.badge != null &&
                        <span className='badge badge-inverse'>{this.props.badge}</span>
                        }</a>
                </div>
            </div>
        );
    }
}

export class AnalysisButton extends Component {

    onStop() {
        Perf.stop();
        const measurements = Perf.getLastMeasurements();
        console.log('Overall: ');
        Perf.printInclusive(measurements);
        console.log('Without component mounting:');
        Perf.printExclusive(measurements);
        console.log('Wasted');
        Perf.printWasted(measurements);
    }

    render() {
        return (
            <div className='samples-analysis-wrapper'>
                <div>
                    <a
                        type='button'
                        href='#'
                        className='btn navbar-btn'
                        id='btnToggle'
                        data-target='#analysis'
                        data-toggle='modal'
                        onClick={() => this.props.openAnalysisModal()}
                    ><span className='hidden-xs'>{this.props.p.t('navBar.analysesButton')}</span>
                        <span className='visible-xs'><i className='ag22 ag-flask'></i></span>
                    </a>
                    {ENABLE_PERFORMANCE_CONTROLS &&
                    <div>
                        <button onClick={() => Perf.start()}>B</button>
                        <button onClick={() => this.onStop()}>E</button>
                    </div>
                    }
                </div>
            </div>
        );
    }
}
