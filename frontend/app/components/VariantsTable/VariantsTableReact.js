import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';
import {getP} from 'redux-polyglot/dist/selectors';

import VariantsTableHead from './VariantsTableHead';
import VariantsTableRows from './VariantsTableRows';
import VariantsTableEmpty from './VariantsTableEmpty';
import VariantsTableLoadError from '../Errors/VariantsTableLoadError';


class VariantsTableReact extends Component {

    constructor(props) {
        super(props);
        this.state = {
            scrollTarget: null
        };
        this.variantsTableHead = null;
        this.variantsTableRows = null;
    }

    render() {
        const {fields, p} = this.props;
        const {variants, variantsHeader, isVariantsLoading, isVariantsEmpty, isVariantsValid, variantsError, variantsAnalysis, variantsSamples} = this.props.ws;
        return (

            <div className='table-variants-wrapper'>
                { isVariantsLoading &&
                <div className='loader'></div>
                }

                { !isVariantsLoading && !isVariantsValid &&
                <div className='col-xs-6 col-xs-offset-3' id='unexpected_variants_error'>
                    <VariantsTableLoadError error={variantsError} p={p}/>
                </div>
                }
                { !isVariantsLoading && isVariantsValid &&
                <div className='table-variants-container'>
                    <table className='table table-striped table-variants table-select-mode' id='variants_table'
                           ref='variantsTable'>
                        <VariantsTableHead fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} variantsSamples={variantsSamples} {...this.props}
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, true); } }
                                           ref={(ref) => ref && this.onAppear(true, ref)}
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} variantsHeader={variantsHeader} variantsAnalysis={variantsAnalysis} {...this.props}
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, false); } }
                                           ref={(ref) => ref && this.onAppear(false, ref)}
                                           p={p}
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
        // fix scroll position after the element is disappeared (ex. after empty results)
        const el = ReactDOM.findDOMNode(ref);
        if (isHeader) {
            this.variantsTableHead = el;
        } else {
            this.variantsTableRows = el;
        }
        const {scrollTarget} = this.state;
        if (scrollTarget != null && el.scrollLeft != scrollTarget) {
            el.scrollLeft = scrollTarget;
        }
    }

    elementXScrollListener(scrollLeft, isHeader) {
        // sync scroll position in body and header.
        const {scrollTarget} = this.state;
        // do nothing if we already there
        if (scrollTarget !== null && scrollLeft == scrollTarget) {
            return;
        }
        const otherDOMNode = isHeader ? this.variantsTableRows : this.variantsTableHead;
        if (otherDOMNode && otherDOMNode.scrollLeft != scrollLeft) {
            this.setState({scrollTarget: scrollLeft});
            otherDOMNode.scrollLeft = scrollLeft;
        }
    }
}

function mapStateToProps(state) {
    const {auth, websocket, ui, variantsTable} = state;

    return {
        auth,
        ws: websocket,
        ui,
        variantsTable,
        p: getP(state)
    };
}

export default connect(mapStateToProps)(VariantsTableReact);
