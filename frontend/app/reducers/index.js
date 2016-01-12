import { combineReducers } from 'redux'

import userData from './userData' 
import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 
import modalWindows from './modalWindows' 
import views from './views' 
import fields from './fields' 



const genApp = combineReducers({
  userData,
  variantsTable,
  exportToFile,
  modalWindows ,
  views,
  fields
})

export default genApp

