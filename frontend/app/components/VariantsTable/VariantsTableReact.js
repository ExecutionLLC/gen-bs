import React, { Component } from 'react';
import { connect } from 'react-redux'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

import { fetchVariants, searchInResults } from '../../actions/variantsTable'

import VariantsTableHead from './VariantsTableHead'
import VariantsTableRows from './VariantsTableRows'
import VariantsTableEmpty from './VariantsTableEmpty'
import DemoModeMessage from '../Errors/DemoModeMessage'


import VariantsTableLoadError from '../Errors/VariantsTableLoadError'


class VariantsTableReact extends Component {

    constructor(props) {
        super(props);
        this.scrollTarget = null;
    }

    render() {
        const { dispatch, auth, views, fields, ui } = this.props
        const { variants, isVariantsLoading, isVariantsEmpty, isVariantsValid, error } = this.props.ws

        var tableWrapperClass = classNames({
            'table-variants-wrapper': true,
            'subnav-closed': ui.queryNavbarClosed
        });

        return (

            <div className={tableWrapperClass}>
                { isVariantsLoading &&
                <div className="loader"></div>
                }

                { !isVariantsLoading && !isVariantsValid &&
                <div className="col-xs-6 col-xs-offset-3">
                    <VariantsTableLoadError error={error}/>
                </div>
                }
                { !isVariantsLoading && isVariantsValid &&
                <div className="table-variants-container">
                    { auth.isDemo &&
                    <DemoModeMessage errorMessage={auth.errorMessage} {...this.props} />
                    }
                    <table className="table table-striped table-variants header-fixed" id="variants_table"
                           ref="variantsTable">
                        <VariantsTableHead variants={variants} fields={fields} {...this.props} ref="variantsTableHead"
                                           xScrollListener={ (scrollLeft) => { this.headerXScrollListener(scrollLeft) } } 
                        />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} {...this.props} ref="variantsTableRows"
                                           xScrollListener={ (scrollLeft) => { this.tableXScrollListener(scrollLeft) } }
                        />
                        }
                    </table>
                    { isVariantsEmpty &&
                    <VariantsTableEmpty />
                    }
                </div>
                }

            </div>

        )
    }

    tableXScrollListener(scrollLeft) {
        // ignore if we want to scroll to already desired place
        if (this.scrollTarget !== null && scrollLeft == this.scrollTarget) {
            return;
        }
        const variantsTableHead = ReactDOM.findDOMNode(this.refs.variantsTableHead);
        if (variantsTableHead) {
            this.scrollTarget = scrollLeft;
            // we should move header manually, because "position" attribute of header equal "fixed"
            if (variantsTableHead.scrollLeft == scrollLeft) {
                // destination point reached - get ready to scroll again
                this.scrollTarget = null;
            } else {
                variantsTableHead.scrollLeft = scrollLeft;
            }
        }
    }

    headerXScrollListener(scrollLeft) {
        // ignore if we want to scroll to already desired place
        if (this.scrollTarget !== null && scrollLeft == this.scrollTarget) {
            return;
        }
        const variantsTableRows = ReactDOM.findDOMNode(this.refs.variantsTableRows);
        if (variantsTableRows) {
            this.scrollTarget = scrollLeft;
            // we should move header manually, because "position" attribute of rows equal "fixed"
            if (variantsTableRows.scrollLeft == scrollLeft) {
                // destination point reached - get ready to scroll again
                this.scrollTarget = null;
            } else {
                variantsTableRows.scrollLeft = scrollLeft;
            }
        }
    }
}

function mapStateToProps(state) {
    const { auth, websocket, ui, variantsTable } = state;
    const { searchParams } = state.websocket;

    return {
        auth,
        ws: websocket,
        ui,
        variantsTable,
        searchParams
    }
}

export default connect(mapStateToProps)(VariantsTableReact)
