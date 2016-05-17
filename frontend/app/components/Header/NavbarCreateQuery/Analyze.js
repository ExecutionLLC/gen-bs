import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Overlay, Tooltip } from 'react-bootstrap';


export default class Analyze extends Component {

    render() {

        const { isAnalyzeTooltipVisible } = this.props.ui;
        const isFetchingSamples = this.props.fields.isFetching.samples; // is fetching fields actually, see REQUEST_FIELDS 

        const tooltip = <Tooltip id='analyze_button_tooltip'>Analyze current sample with current filters and view</Tooltip>;

        const overlayProps = {
            show: isAnalyzeTooltipVisible,
            container: this,
            target: () => ReactDOM.findDOMNode(this.refs.analyze_tooltip_target)

        };
        return (

        <div className='table-cell table-cell-xs-4'>
            <div className='btn-group'
              data-localize='query.analyze.help'
              ref='analyze_tooltip_target'
              >  
              <button className='btn btn-primary' type='button' disabled={isFetchingSamples} onClick={this.props.clicked}>
                 <span data-localize='query.analyze.title'>Analyze</span>
              </button>
            <Overlay {...overlayProps} placement='bottom'>
                { tooltip }
            </Overlay>
            </div>

        </div>

    );
    }
}
