import { combineReducers } from 'redux'
import * as ActionTypes from '../actions'

import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 



const genApp = combineReducers({
  variantsTable,
  exportToFile
})

export default genApp

