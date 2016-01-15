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
    //this.props.dispatch(fetchVariants())
  }

  render() {
    const { dispatch, variants, isVariantsEmpty, views, fields, ui } = this.props
    //const { variants, isVariantsEmpty } = this.props.websocket
    //const variants = this.props.websocket.variants
    console.log('var table', this.props)

    var tableWrapperClass = classNames({
      'table-variants-wrapper': true,
      'subnav-closed': ui.queryNavbarClosed
    });

    return (

        <div className={tableWrapperClass}>
          { isVariantsEmpty &&
            <div class="loader"></div>
          }
          { !isVariantsEmpty &&
            <div className="table-variants-container">
              <table className="table table-hover table-bordered table-striped table-variants table-resposive" id="variants_table">
                <VariantsTableHead variants={variants} view={views.current} fields={fields.list} />
                <VariantsTableRows variants={variants} view={views.current} fields={fields.list} />
              </table> 
            </div>
          }
        </div>


    )
  }
}

function mapStateToProps(state) {
  const { websocket, ui } = state
  console.log('table state ws',websocket)

  return {
    variants: websocket.variants,
    isVariantsEmpty: websocket.isVariantsEmpty,
    ui
  }
}

//function mapDispatchToProps(dispatch) {
//  return {
//    onLoad: () => dispatch(increment())
//  }
//}

export default connect(mapStateToProps)(VariantsTableReact)

