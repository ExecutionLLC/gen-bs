import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';

import VariantsTableHead from './VariantsTableHead';
import VariantsTableRows from './VariantsTableRows';
import VariantsTableEmpty from './VariantsTableEmpty';
import DemoModeMessage from '../Errors/DemoModeMessage';


import VariantsTableLoadError from '../Errors/VariantsTableLoadError';


class VariantsTableReact extends Component {

    constructor(props) {
        super(props);
        this.scrollTarget = null;
        this.state = {
            scrollTarget: null
        };
    }

    render() {
        const {auth, fields} = this.props;
        const {variants, variantsHeader, isVariantsLoading, isVariantsEmpty, isVariantsValid, error, variantsAnalysis, variantsSamples} = this.props.ws;

        return (

            <div className='table-variants-wrapper'>
                { isVariantsLoading &&
                <div className='loader'></div>
                }

                { !isVariantsLoading && !isVariantsValid &&
                <div className='col-xs-6 col-xs-offset-3' id='unexpected_variants_error'>
                    <VariantsTableLoadError error={error}/>
                </div>
                }
                { !isVariantsLoading && isVariantsValid &&
                <div className='table-variants-container'>
                    { auth.isDemo &&
                    <DemoModeMessage errorMessage={auth.errorMessage} {...this.props} />
                    }
                    <table className='table table-striped table-variants header-fixed' id='variants_table'
                           ref='variantsTable'>
                        <VariantsTableHead fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} variantsSamples={variantsSamples} {...this.props} ref='variantsTableHead'
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, ReactDOM.findDOMNode(this.refs.variantsTableRows)); } }
                                           onRendered={() => this.onTablePartRendered(true)}
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} {...this.props} ref='variantsTableRows'
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, ReactDOM.findDOMNode(this.refs.variantsTableHead)); } }
                                           onRendered={() => this.onTablePartRendered(false)}
                        />
                        }
                    </table>
                    { isVariantsEmpty &&
                    <VariantsTableEmpty />
                    }
                </div>
                }

            </div>

        );
    }

    elementXScrollListener(scrollLeft, DOMNode) {
        // ignore if we want to scroll to already desired place
        if (this.state.scrollTarget !== null && scrollLeft == this.state.scrollTarget) {
            return;
        }
        if (DOMNode) {
            // we should move header manually, because "position" attribute of element is "fixed"
            if (DOMNode.scrollLeft == scrollLeft) {
                // destination point reached - get ready to scroll again
                this.setState({scrollTarget: null});
            } else {
                this.setState({scrollTarget: scrollLeft});
                DOMNode.scrollLeft = scrollLeft;
            }
        }
    }

    onTablePartRendered(isHeader) {
        if (this.state.scrollTarget == null) {
            return;
        }
        const tablePartRef = isHeader ? this.refs.variantsTableHead : this.refs.variantsTableRows;
        const tablePartElement = ReactDOM.findDOMNode(tablePartRef);
        tablePartElement.scrollLeft = this.state.scrollTarget;
    }
}

function mapStateToProps(state) {
    const {auth, websocket, ui, variantsTable} = state;

    return {
        auth,
        ws: websocket,
        ui,
        variantsTable
    };
}

export default connect(mapStateToProps)(VariantsTableReact);
