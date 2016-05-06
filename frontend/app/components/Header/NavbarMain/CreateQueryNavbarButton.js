import React, {Component} from 'react';
import Perf from 'react-addons-perf';


export default class CreateQeuryNavbarButton extends Component {
    constructor(props) {
        super(props);

        this.enablePerformanceControls = false;
    }

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
                <div className='visible-xs'><a type='button' href='#' className='btn navbar-btn' data-toggle='modal'
                                               data-target='#analysis'><i className='md-i'>settings</i></a></div>

                <div className='hidden-xs' data-localize='query.help' data-toggle='tooltip' data-placement='right'
                     title='Open navbar and create new analises query' data-container='body' data-trigger='hover'>
                    <a onClick={this.props.toggleQueryNavbar} type='button' href='#' className='btn navbar-btn'
                       id='btnToggle'>Analyze
                    </a>
                    {this.enablePerformanceControls &&
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
