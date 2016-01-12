import React, { Component } from 'react';
import { connect } from 'react-redux'

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
    const { variants, views, fields } = this.props
    return (

        <div className="table-variants-wrapper">
          <div className="table-variants-container">
            <table className="table table-hover table-bordered table-striped table-variants table-resposive" id="variants_table">
              <VariantsTableHead variants={variants} view={views.current} fields={fields.list} />
              <VariantsTableRows variants={this.props.variants}/>
            </table> 
          </div>
        </div>


    )
  }
}

function mapStateToProps(state) {
  const { variantsTable } = state

  return {
    variants: variantsTable.variants
  }
}

//function mapDispatchToProps(dispatch) {
//  return {
//    onLoad: () => dispatch(increment())
//  }
//}

export default connect(mapStateToProps)(VariantsTableReact)

