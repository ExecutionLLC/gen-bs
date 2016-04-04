import Moment from 'moment';

import apiFacade from '../api/ApiFacade';
import ExportUtils from '../utils/exportUtils';
import {handleError} from './errorHandler';

export const RECEIVE_SAVED_FILES_LIST = 'RECEIVE_SAVED_FILES_LIST';
export const CREATE_EXPORT_DOWNLOAD = 'CREATE_EXPORT_DOWNLOAD';
export const SAVED_FILE_UPLOAD_RESULT_RECEIVED = 'SAVED_FILE_UPLOAD_RESULT_RECEIVED';
export const SAVED_FILE_DOWNLOAD_RESULT_RECEIVED = 'SAVED_FILE_DOWNLOAD_RESULT_RECEIVED';
export const SHOW_SAVED_FILES_DIALOG = 'SHOW_SAVED_FILES_DIALOG';
export const CLOSE_SAVED_FILES_DIALOG = 'CLOSE_SAVED_FILES_DIALOG';

const ERROR_UPLOADING_EXPORTED_FILE = 'Error while uploading exported file';

const savedFilesClient = apiFacade.savedFilesClient;

function createUserDownload(fileBlob, fileName) {
    return {
        type: CREATE_EXPORT_DOWNLOAD,
        fileBlob,
        fileName
    }
}

function saveExportedFileToServer(fileBlob, fileName, totalResults) {
    return (dispatch, getState) => {
        const {
            ui: {
                currentSample,
                currentView,
                currentFilter,
                language
            },
            auth: {
                sessionId
            }
        } = getState();
        const fileMetadata = {
            sampleId: currentSample.id,
            viewId: currentView.id,
            filterIds: [currentFilter.id],
            name: fileName,
            url: null,
            totalResults
        };
        savedFilesClient.add(language, sessionId, fileMetadata, fileBlob, (error, response) => {
            if (error) {
                dispatch(handleError(`${ERROR_UPLOADING_EXPORTED_FILE}: ` + error));
            } else {
                const savedFile = response.body;
                dispatch(savedFileUploadResultReceived(savedFile));
            }
        });
    };
}

function savedFileUploadResultReceived(savedFile) {
    return {
        type: SAVED_FILE_UPLOAD_RESULT_RECEIVED,
        savedFile
    }
}

function savedFileDownloadResultReceived(savedFileBlob, fileName) {
    return {
        type: SAVED_FILE_DOWNLOAD_RESULT_RECEIVED,
        savedFileBlob,
        fileName
    }
}

export function showSavedFilesModal() {
    return {
        type: SHOW_SAVED_FILES_DIALOG
    }
}

export function closeSavedFilesDialog() {
    return {
        type: CLOSE_SAVED_FILES_DIALOG
    }
}

export function receiveSavedFilesList(savedFilesList) {
    return {
        type: RECEIVE_SAVED_FILES_LIST,
        savedFilesList
    };
}

export function downloadSavedFile(savedFile) {
    return (dispatch, getState) => {
        const {
            auth: {
                sessionId,
            },
            ui: {
                language
            }
        } = getState();
        savedFilesClient.download(language, sessionId, savedFile.id, (error, response) => {
            if (error) {
                dispatch(handleError(error))
            } else {
                dispatch(savedFileDownloadResultReceived(response.blob, savedFile.name));
            }
        });
    }
}

export function exportToFile(exportType) {
    return (dispatch, getState) => {
        const {
            auth: {
                isDemo
            },
            ui: {
                currentView,
                currentSample
            },
            variantsTable: {
                selectedSearchKeysToVariants
            },
            fields: {
                totalFieldsHash
            }
        } = getState();

        // Take fields in order they appear in the view
        // and add comments as a separate field values.
        const columns = _.map(currentView.view_list_items, listItem => {
                const field = totalFieldsHash[listItem.field_id];
                return {
                    id: listItem.field_id,
                    name: field.label
                }
            })
            .concat([{
                id: 'comment',
                name: 'Comment'
            }]);

        // The export data should be array of objects in {field_id -> field_value} format.
        const dataToExport = _(selectedSearchKeysToVariants)
            .sortBy(item => item.rowIndex)
            .map(item => {
                // Add first comment.
                const comment = _.isEmpty(item.row.comments) ? '' : item.row.comments[0].comment;
                return Object.assign({}, item.row.fieldsHash, {
                    comment
                });
            })
            .value();

        const exporter = ExportUtils.createExporter(exportType);
        const fileBlob = exporter.buildBlob(columns, dataToExport);
        const createdDate = Moment().format('YYYY-MM-DD-HH-mm-ss');
        const fileName = `${currentSample.file_name}_chunk_${createdDate}.${exportType}`;
        const count = selectedSearchKeysToVariants.length;

        dispatch(createUserDownload(fileBlob, fileName));

        if (!isDemo) {
            dispatch(saveExportedFileToServer(fileBlob, fileName, count));
        }
    };
}
