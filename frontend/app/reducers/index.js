import { combineReducers } from 'redux'

import auth from './auth' 
import userData from './userData' 
import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 
import modalWindows from './modalWindows' 
import views from './views' 
import fields from './fields' 
import ui from './ui' 



const genApp = combineReducers({
  auth,
  userData,
  variantsTable,
  exportToFile,
  modalWindows ,
  views,
  fields,
  ui
})

export default genApp

