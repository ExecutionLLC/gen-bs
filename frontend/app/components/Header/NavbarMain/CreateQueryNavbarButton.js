
import React, { Component } from 'react';
import Perf from 'react-addons-perf';

const ENABLE_PERFORMANCE_CONTROLS = false;

export default class CreateQeuryNavbarButton extends Component {

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
            <div>
                <div>
                    <a onClick={this.props.toggleQueryNavbar} type='button' href='#' className='btn navbar-btn'
                       id='btnToggle'>
                        <span className='hidden-xs' data-localize='query.help' data-toggle='tooltip'
                              data-placement='right' title='Open navbar and create new analises query'
                              data-container='body' data-trigger='hover'>Analyze</span>
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
