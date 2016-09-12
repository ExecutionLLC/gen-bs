import Moment from 'moment';
import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import ExportUtils from '../utils/exportUtils';
import {handleError} from './errorHandler';
import SamplesUtils from '../utils/samplesUtils';

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
                language
            },
            websocket: {
                variantsAnalysis
            }
        } = getState();
        const fileMetadata = {
            analysisId: variantsAnalysis.id,
            name: fileName,
            totalResults
        };
        savedFilesClient.add(language, fileMetadata, fileBlob, (error, response) => {
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
            ui: {
                language
            }
        } = getState();
        savedFilesClient.download(language, savedFile.id, (error, response) => {
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
                variantsHeader,
                variantsSamples,
                variantsAnalysis
            },
            variantsTable: {
                selectedRowIndices
            },
            fields: {
                totalFieldsHashedArray: {hash: totalFieldsHash}
            }
        } = getState();

        const variantsAnalysisSamplesHash = _.keyBy(variantsAnalysis.samples, (sample) => sample.id);
        // Take fields in order they appear in the view
        // and add comments as a separate field values.
        const columns = _.map(variantsHeader, listItem => {
            const field = totalFieldsHash[listItem.fieldId];
            const sample = variantsAnalysisSamplesHash[listItem.sampleId];
            const sampleType = sample && SamplesUtils.typeLabels[sample.type];
            return field.label + (field.sourceName && field.sourceName !== 'sample' ? ` - ${field.sourceName}` : sampleType ? ` - ${sampleType}` : '');
        })
        .concat(['Comment']);

        const dataToExport = _(selectedRowIndices.sort((rowIndex1, rowIndex2) => rowIndex1 - rowIndex2))
            .map(rowIndex => [...variants[rowIndex].fields, ...[_.isEmpty(variants[rowIndex].comments) ? '' : variants[rowIndex].comments[0].comment]])
            .value();

        const exporter = ExportUtils.createExporter(exportType);
        const fileBlob = exporter.buildBlob(columns, dataToExport);
        const createdDate = Moment().format('YYYY-MM-DD-HH-mm-ss');
        const fileName = `${_.map(variantsSamples, (variantsSample) => variantsSample.fileName).join('-')}_chunk_${createdDate}.${exportType}`;
        const count = selectedRowIndices.length;

        dispatch(createUserDownload(fileBlob, fileName));

        if (!isDemo) {
            dispatch(saveExportedFileToServer(fileBlob, fileName, count));
        }
    };
}
