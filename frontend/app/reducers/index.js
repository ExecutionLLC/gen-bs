import { combineReducers } from 'redux'
import * as ActionTypes from '../actions'

import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 

import modalWindows from './modalWindows' 



const genApp = combineReducers({
  variantsTable,
  exportToFile,
  modalWindows 
})

export default genApp

