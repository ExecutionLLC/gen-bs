import { combineReducers } from 'redux';

import auth from './auth';
import userData from './userData';
import variantsTable from './variantsTable';
import exportToFile from './exportToFile';
import modalWindows from './modalWindows';
import viewBuilder from './viewBuilder';
import filterBuilder from './filterBuilder';
import fields from './fields';
import ui from './ui';
import websocket from './websocket'
import fileUpload from './fileUpload';
import errorHandler from './errorHandler';

const genApp = combineReducers({
    auth,
    userData,
    variantsTable,
    exportToFile,
    modalWindows,
    viewBuilder,
    filterBuilder,
    fields,
    ui,
    websocket,
    fileUpload,
    errorHandler
});

export default genApp;
