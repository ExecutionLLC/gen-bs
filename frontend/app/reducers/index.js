import { combineReducers } from 'redux'

import userData from './userData' 
import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 
import modalWindows from './modalWindows' 



const genApp = combineReducers({
  userData,
  variantsTable,
  exportToFile,
  modalWindows 
})

export default genApp

