import { combineReducers } from 'redux';

import auth from './auth';
import userData from './userData';
import variantsTable from './variantsTable';
import savedFiles from './savedFiles';
import modalWindows from './modalWindows';
import viewBuilder from './viewBuilder';
import filterBuilder from './filterBuilder';
import fields from './fields';
import ui from './ui';
import samplesList from './samplesList';
import websocket from './websocket';
import fileUpload from './fileUpload';
import errorHandler from './errorHandler';
import analysesHistory from './analysesHistory';
import filtersList from './filtersList';
import viewsList from './viewsList';
import modelsList from './modelsList';
import metadata from './metadata';

const genApp = combineReducers({
    auth,
    userData,
    variantsTable,
    savedFiles,
    modalWindows,
    viewBuilder,
    filterBuilder,
    fields,
    ui,
    samplesList,
    filtersList,
    viewsList,
    modelsList,
    websocket,
    fileUpload,
    errorHandler,
    analysesHistory,
    metadata
});

export default genApp;
