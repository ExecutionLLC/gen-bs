import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import VariantsTableHead from './VariantsTableHead';
import VariantsTableRows from './VariantsTableRows';
import VariantsTableEmpty from './VariantsTableEmpty';
import DemoModeMessage from '../Errors/DemoModeMessage';


import VariantsTableLoadError from '../Errors/VariantsTableLoadError';


class VariantsTableReact extends Component {

    constructor(props) {
        super(props);
        this.scrollTarget = null;
    }

    render() {
        const {auth, fields, ui} = this.props;
        const {variants, isVariantsLoading, isVariantsEmpty, isVariantsValid, error} = this.props.ws;

        var tableWrapperClass = classNames({
            'table-variants-wrapper': true
        });

        return (

            <div className={tableWrapperClass}>
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
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} {...this.props} ref='variantsTableRows'
                                           xScrollListener={ (scrollLeft) => { this.elementXScrollListener(scrollLeft, ReactDOM.findDOMNode(this.refs.variantsTableHead)); } }
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
        if (this.scrollTarget !== null && scrollLeft == this.scrollTarget) {
            return;
        }
        if (DOMNode) {
            this.scrollTarget = scrollLeft;
            // we should move header manually, because "position" attribute of element is "fixed"
            if (DOMNode.scrollLeft == scrollLeft) {
                // destination point reached - get ready to scroll again
                this.scrollTarget = null;
            } else {
                DOMNode.scrollLeft = scrollLeft;
            }
        }
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
