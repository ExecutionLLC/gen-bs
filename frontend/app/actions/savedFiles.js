import Moment from 'moment';
import _ from 'lodash';
import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import ExportUtils from '../utils/exportUtils';
import {handleApiBodylessResponseErrorAsync, handleApiResponseErrorAsync} from './errorHandler';
import * as SamplesUtils from '../utils/samplesUtils';
import FieldUtils from '../utils/fieldUtils';
import * as i18n from '../utils/i18n';

export const RECEIVE_SAVED_FILES_LIST = 'RECEIVE_SAVED_FILES_LIST';
export const CREATE_EXPORT_DOWNLOAD = 'CREATE_EXPORT_DOWNLOAD';
export const SAVED_FILE_UPLOAD_RESULT_RECEIVED = 'SAVED_FILE_UPLOAD_RESULT_RECEIVED';
export const SAVED_FILE_DOWNLOAD_RESULT_RECEIVED = 'SAVED_FILE_DOWNLOAD_RESULT_RECEIVED';
export const SHOW_SAVED_FILES_DIALOG = 'SHOW_SAVED_FILES_DIALOG';
export const CLOSE_SAVED_FILES_DIALOG = 'CLOSE_SAVED_FILES_DIALOG';

const savedFilesClient = apiFacade.savedFilesClient;

function createUserDownload(fileBlob, fileName) {
    return {
        type: CREATE_EXPORT_DOWNLOAD,
        fileBlob,
        fileName
    };
}

function saveExportedFileToServerAsync(fileBlob, fileName, totalResults) {
    return (dispatch, getState) => {
        const {
            ui: {
                languageId
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
        return new Promise((resolve) => savedFilesClient.add(
            languageId,
            fileMetadata,
            fileBlob,
            (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('savedFiles.errors.uploadError'), error, response));
        }).then(
            (response) => response.body
        ).then((savedFile) => dispatch(savedFileUploadResultReceived(savedFile)));
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

export function downloadSavedFileAsync(savedFile) {
    return (dispatch, getState) => {
        const {
            ui: {
                languageId
            }
        } = getState();
        return new Promise((resolve) => savedFilesClient.download(
            languageId,
            savedFile.id,
            (error, response) => resolve({error, response})
        )).then(
            ({error, response}) => {
                const p = getP(getState());
                return dispatch(handleApiBodylessResponseErrorAsync(p.t('savedFiles.errors.downloadError'), error, response));
            }
        ).then((response) => dispatch(savedFileDownloadResultReceived(response.blob, savedFile.name)));
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
            },
            ui: {
                languageId
            }
        } = getState();

        const variantsAnalysisSamplesHash = _.keyBy(variantsAnalysis.samples, (sample) => sample.id);
        // Take fields in order they appear in the view
        // and add comments as a separate field values.
        const columns = _.map(variantsHeader, listItem => {
            const field = totalFieldsHash[listItem.fieldId];
            const sample = variantsAnalysisSamplesHash[listItem.sampleId];
            const sampleType = sample && SamplesUtils.typeLabels[sample.type];
            return FieldUtils.makeFieldSavedCaption(field, sampleType, languageId);
        })
        .concat(['Comment']);

        const dataToExport = _(selectedRowIndices.sort((rowIndex1, rowIndex2) => rowIndex1 - rowIndex2))
            .map(rowIndex => [
                ...variants[rowIndex].fields,
                ...[_.isEmpty(variants[rowIndex].comments) ? '' : i18n.getEntityText(variants[rowIndex].comments[0], languageId).comment]
            ])
            .value();

        const exporter = ExportUtils.createExporter(exportType);
        const fileBlob = exporter.buildBlob(columns, dataToExport);
        const createdDate = Moment().format('YYYY-MM-DD-HH-mm-ss');
        const fileName = `${
            _.map(variantsSamples, (variantsSample) =>
                i18n.getEntityText(variantsSample, languageId).name
            ).join('-')}_chunk_${createdDate}.${exportType}`;
        const count = selectedRowIndices.length;

        dispatch(createUserDownload(fileBlob, fileName));

        if (!isDemo) {
            dispatch(saveExportedFileToServerAsync(fileBlob, fileName, count));
        }
    };
}
