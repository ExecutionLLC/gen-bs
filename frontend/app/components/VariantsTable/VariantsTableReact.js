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

    render() {
        const { dispatch, auth, views, fields, ui } = this.props
        const { variants, isVariantsLoading, isVariantsEmpty, isVariantsValid, error } = this.props.ws

        var tableWrapperClass = classNames({
            'table-variants-wrapper': true
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
                        <VariantsTableHead variants={variants} fields={fields} {...this.props} ref="variantsTableHead"/>
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} {...this.props}
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
        const variantsTableHead = ReactDOM.findDOMNode(this.refs.variantsTableHead);
        if (variantsTableHead) {
            // we should move header manually, because "position" attribute of header equal "fixed"
            variantsTableHead.scrollLeft = scrollLeft;
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
