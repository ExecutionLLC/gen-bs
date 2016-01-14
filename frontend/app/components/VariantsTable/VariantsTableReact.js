import React, { Component } from 'react';
import { connect } from 'react-redux'
import classNames from 'classnames'

import { fetchVariants } from '../../actions/variantsTable'

import VariantsTableHead from './VariantsTableHead'
import VariantsTableRows from './VariantsTableRows'



class VariantsTableReact extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.dispatch(fetchVariants())
  }

  render() {
    const { variants, views, fields, ui } = this.props

    var tableWrapperClass = classNames({
      'table-variants-wrapper': true,
      'subnav-closed': ui.queryNavbarClosed
    });

    return (

        <div className={tableWrapperClass}>
          <div className="table-variants-container">
            <table className="table table-hover table-bordered table-striped table-variants table-resposive" id="variants_table">
              <VariantsTableHead variants={variants} view={views.current} fields={fields.list} />
              <VariantsTableRows variants={this.props.variants} view={views.current} fields={fields.list} />
            </table> 
          </div>
        </div>


    )
  }
}

function mapStateToProps(state) {
  const { variantsTable, ui } = state

  return {
    variants: variantsTable.variants,
    ui
  }
}

//function mapDispatchToProps(dispatch) {
//  return {
//    onLoad: () => dispatch(increment())
//  }
//}

export default connect(mapStateToProps)(VariantsTableReact)

