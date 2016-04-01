import * as ActionTypes from '../actions/savedFiles'

import ExportUtils from '../utils/exportUtils';

export default function savedFiles(state = {
    showSavedFilesModal: false,
    list: []
}, action) {
    switch (action.type) {
        case ActionTypes.CREATE_EXPORT_DOWNLOAD: {
            const {
                fileBlob,
                fileName
            } = action;

            ExportUtils.downloadBlob(fileBlob, fileName);
            return state;
        }
            
        case ActionTypes.RECEIVE_SAVED_FILES_LIST: {
            return Object.assign({}, state, {
                list: action.savedFilesList
            });
        }

        case ActionTypes.SAVED_FILE_UPLOAD_RESULT_RECEIVED: {
            // Put newly added file to the beginning of the array.
            const {savedFiles} = state;
            const {savedFile} = action;
            const newSavedFiles = [savedFile].concat((savedFiles || []).slice());
            return Object.assign({}, state, {
                list: newSavedFiles
            });
        }

        case ActionTypes.SAVED_FILE_DOWNLOAD_RESULT_RECEIVED: {
            const {savedFileBlob, fileName} = action;
            ExportUtils.downloadBlob(savedFileBlob, fileName);
            return state;
        }

        case ActionTypes.SHOW_SAVED_FILES_DIALOG: {
            return Object.assign({}, state, {
                showSavedFilesModal: true
            });
        }

        case ActionTypes.CLOSE_SAVED_FILES_DIALOG: {
            return Object.assign({}, state, {
                showSavedFilesModal: false
            });
        }

        default:
            return state
    }
}
