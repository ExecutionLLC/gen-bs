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
        const {variants, isVariantsLoading, isVariantsEmpty, isVariantsValid, error} = this.props.ws;

        return (

            <div className='table-variants-wrapper'>
                { isVariantsLoading &&
                <div className='loader'></div>
                }

                { !isVariantsLoading && !isVariantsValid &&
                <div className='col-xs-6 col-xs-offset-3'>
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
                        <VariantsTableHead variants={variants} fields={fields} {...this.props} ref='variantsTableHead'
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, ReactDOM.findDOMNode(this.refs.variantsTableRows)); } }
                                           onRendered={() => this.onTablePartRendered(true)}
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} {...this.props} ref='variantsTableRows'
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
    const {searchParams} = state.websocket;

    return {
        auth,
        ws: websocket,
        ui,
        variantsTable,
        searchParams
    };
}

export default connect(mapStateToProps)(VariantsTableReact);
