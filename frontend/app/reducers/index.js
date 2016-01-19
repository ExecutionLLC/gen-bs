import { combineReducers } from 'redux'

import auth from './auth' 
import userData from './userData' 
import variantsTable from './variantsTable' 
import exportToFile from './exportToFile' 
import modalWindows from './modalWindows' 
import viewBuilder from './viewBuilder' 
import fields from './fields' 
import ui from './ui' 
import websocket from './websocket' 



const genApp = combineReducers({
  auth,
  userData,
  variantsTable,
  exportToFile,
  modalWindows ,
  viewBuilder,
  fields,
  ui,
  websocket
})

export default genApp

