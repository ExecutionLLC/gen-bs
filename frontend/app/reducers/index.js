import { combineReducers } from 'redux'
import * as ActionTypes from '../actions'

import variantsTable from './variantsTable' 
import exportFileType from './exportToFile' 



const genApp = combineReducers({
  variantsTable,
  exportFileType
})

export default genApp

