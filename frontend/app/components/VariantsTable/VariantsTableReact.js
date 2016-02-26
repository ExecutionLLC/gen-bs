import React, { Component } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'

import { fetchVariants, searchInResults } from '../../actions/variantsTable'

import VariantsTableHead from './VariantsTableHead'
import VariantsTableRows from './VariantsTableRows'
import VariantsTableEmpty from './VariantsTableEmpty'


import VariantsTableLoadError from '../Errors/VariantsTableLoadError'



class VariantsTableReact extends Component {

  render() {
    const { dispatch, views, fields, ui } = this.props
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
              <VariantsTableLoadError errors={errors} />
            </div>
          }

          { !isVariantsLoaded && isVariantsEmpty && isVariantsValid &&
            <div className="col-xs-6 col-xs-offset-3">
              <VariantsTableEmpty />
            </div>
          }
          { !isVariantsLoaded && !isVariantsEmpty && isVariantsValid &&
            <div className="table-variants-container">
              <table className="table table-hover table-bordered table-striped table-variants table-resposive" id="variants_table">
                <VariantsTableHead variants={variants} fields={fields} {...this.props} />
                <VariantsTableRows variants={variants} fields={fields} {...this.props} />
              </table> 
            </div>
          }
        </div>


    )
  }
}

function mapStateToProps(state) {
  const { websocket, ui, variantsTable } = state

  return {
    ws: websocket,
    ui,
    variantsTable
  }
}

export default connect(mapStateToProps)(VariantsTableReact)

