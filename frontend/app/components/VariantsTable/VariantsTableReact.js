import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';

import VariantsTableHead from './VariantsTableHead';
import VariantsTableRows from './VariantsTableRows';
import VariantsTableEmpty from './VariantsTableEmpty';


import VariantsTableLoadError from '../Errors/VariantsTableLoadError';


class VariantsTableReact extends Component {

    constructor(props) {
        super(props);
        this.scrollTarget = null;
        this.state = {
            scrollTarget: null
        };
        this.variantsTableHead = null;
        this.variantsTableRows = null;
    }

    render() {
        const {fields} = this.props;
        const {variants, variantsHeader, isVariantsLoading, isVariantsEmpty, isVariantsValid, variantsError, variantsAnalysis, variantsSamples} = this.props.ws;

        return (

            <div className='table-variants-wrapper'>
                { isVariantsLoading &&
                <div className='loader'></div>
                }

                { !isVariantsLoading && !isVariantsValid &&
                <div className='col-xs-6 col-xs-offset-3' id='unexpected_variants_error'>
                    <VariantsTableLoadError error={variantsError}/>
                </div>
                }
                { !isVariantsLoading && isVariantsValid &&
                <div className='table-variants-container'>
                    <table className='table table-striped table-variants header-fixed' id='variants_table'
                           ref='variantsTable'>
                        <VariantsTableHead fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} variantsSamples={variantsSamples} {...this.props}
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, true); } }
                                           ref={(ref) => ref && this.onAppear(true, ref)}
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} {...this.props}
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, false); } }
                                           ref={(ref) => ref && this.onAppear(false, ref)}
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

    onAppear(isHeader, ref) {
        const el = ReactDOM.findDOMNode(ref);
        if (isHeader) {
            this.variantsTableHead = el;
        } else {
            this.variantsTableRows = el;
        }
        const {scrollTarget} = this.state;
        el.scrollLeft = scrollTarget;
    }

    elementXScrollListener(scrollLeft, isHeader) {
        const {scrollTarget} = this.state;
        // ignore if we want to scroll to already desired place
        if (scrollTarget !== null && scrollLeft == scrollTarget) {
            return;
        }
        const otherDOMNode = isHeader ? this.variantsTableRows : this.variantsTableHead;
        if (otherDOMNode) {
            // we should move header manually, because "position" attribute of element is "fixed"
            if (otherDOMNode.scrollLeft == scrollLeft) {
                // destination point reached - get ready to scroll again
                this.setState({scrollTarget: null});
            } else {
                this.setState({scrollTarget: scrollLeft});
                otherDOMNode.scrollLeft = scrollLeft;
            }
        }
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
