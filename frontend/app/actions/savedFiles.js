import Moment from 'moment';
import HttpStatus from 'http-status';

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
const ERROR_DOWNLOADING_EXPORTED_FILE = 'Error downloading exported file';

const savedFilesClient = apiFacade.savedFilesClient;

function createUserDownload(fileBlob, fileName) {
    return {
        type: CREATE_EXPORT_DOWNLOAD,
        fileBlob,
        fileName
    };
}

function saveExportedFileToServer(fileBlob, fileName, totalResults) {
    return (dispatch, getState) => {
        const {
            ui: {
                selectedView,
                selectedFilter,
                language
            },
            auth: {
                sessionId
            },
            samplesList: {
                selectedSample
            }
        } = getState();
        const fileMetadata = {
            sampleId: selectedSample.id,
            viewId: selectedView.id,
            filterIds: [selectedFilter.id],
            name: fileName,
            url: null,
            totalResults
        };
        savedFilesClient.add(language, sessionId, fileMetadata, fileBlob, (error, response) => {
            if (error || response.status !== HttpStatus.OK) {
                dispatch(handleError(response.status, ERROR_UPLOADING_EXPORTED_FILE));
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
    };
}

function savedFileDownloadResultReceived(savedFileBlob, fileName) {
    return {
        type: SAVED_FILE_DOWNLOAD_RESULT_RECEIVED,
        savedFileBlob,
        fileName
    };
}

export function showSavedFilesModal() {
    return {
        type: SHOW_SAVED_FILES_DIALOG
    };
}

export function closeSavedFilesDialog() {
    return {
        type: CLOSE_SAVED_FILES_DIALOG
    };
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
                sessionId
            },
            ui: {
                language
            }
        } = getState();
        savedFilesClient.download(language, sessionId, savedFile.id, (error, response) => {
            if (error || response.status !== HttpStatus.OK) {
                dispatch(handleError(response.status, ERROR_DOWNLOADING_EXPORTED_FILE));
            } else {
                dispatch(savedFileDownloadResultReceived(response.blob, savedFile.name));
            }
        });
    };
}

export function exportToFile(exportType) {
    return (dispatch, getState) => {
        const {
            auth: {
                isDemo
            },
            websocket: {
                variants,
                variantsView,
                variantsSample
            },
            variantsTable: {
                selectedRowIndices
            },
            fields: {
                totalFieldsHash
            }
        } = getState();

        // Take fields in order they appear in the view
        // and add comments as a separate field values.
        const columns = _.map(variantsView.viewListItems, listItem => {
            const field = totalFieldsHash[listItem.fieldId];
            return {
                id: listItem.fieldId,
                name: field.label
            };
        })
        .concat([{
            id: 'comment',
            name: 'Comment'
        }]);

        // The export data should be array of objects in {field_id -> field_value} format.
        const dataToExport = _(selectedRowIndices.sort())
            .map(rowIndex => Object.assign({}, rowIndex, {
                rowIndex,
                row: variants[rowIndex]
            }))
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
        const fileName = `${variantsSample.fileName}_chunk_${createdDate}.${exportType}`;
        const count = selectedRowIndices.length;

        dispatch(createUserDownload(fileBlob, fileName));

        if (!isDemo) {
            dispatch(saveExportedFileToServer(fileBlob, fileName, count));
        }
    };
}
