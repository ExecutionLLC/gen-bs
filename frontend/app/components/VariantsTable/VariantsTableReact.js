import React, { Component } from 'react';
import { connect } from 'react-redux'
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
        const { variants, isVariantsLoaded, isVariantsEmpty, isVariantsValid, errors } = this.props.ws

        var tableWrapperClass = classNames({
            'table-variants-wrapper': true,
            'subnav-closed': ui.queryNavbarClosed
        });

        return (

            <div className={tableWrapperClass}>
                { isVariantsLoaded &&
                <div className="loader"></div>
                }

                { !isVariantsLoaded && !isVariantsValid &&
                <div className="col-xs-6 col-xs-offset-3">
                    <VariantsTableLoadError errors={errors}/>
                </div>
                }
                { !isVariantsLoaded && isVariantsValid &&
                <div className="table-variants-container">
                    { auth.isDemo &&
                    <DemoModeMessage errorMessage={auth.errorMessage} {...this.props} />
                    }
                    <table className="table table-striped table-variants header-fixed" id="variants_table"
                           ref="variantsTable">
                        <VariantsTableHead variants={variants} fields={fields} {...this.props} />
                        { !isVariantsEmpty &&
                        <VariantsTableRows variants={variants} fields={fields} {...this.props} />
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
}

function mapStateToProps(state) {
    const { auth, websocket, ui, variantsTable } = state;

    return {
        auth,
        ws: websocket,
        ui,
        variantsTable
    }
}

export default connect(mapStateToProps)(VariantsTableReact)
