import * as ActionTypes from '../actions/fileUpload';

const initialState = {
    filesProcesses: []
};

/**
 * @template {FP}
 * @param {Array.<FP>} filesProcesses
 * @param {number} id
 * @return {number}
 */
function findFileProcessIndex(filesProcesses, id) {
    return filesProcesses.findIndex((fp) => fp.id === id);
}

/**
 * @template {FP}
 * @param {Array.<FP>} filesProcesses
 * @param {number} index
 * @param {FP} newFileProcess
 * @returns {Array.<FP>}
 */
function editFilesProcesses(filesProcesses, index, newFileProcess) {
    return [
        ...filesProcesses.slice(0, index),
        newFileProcess,
        ...filesProcesses.slice(index + 1, filesProcesses.length)
    ];
}

/**
 * @template {FP}
 * @param {Array.<FP>} filesProcesses
 * @param {number|null} id - null or undefined - return filesProcesses
 * @param {FP} fp
 * @returns {Array.<FP>}
 */
function assignFileProcess(filesProcesses, id, fp) {
    if (id == null) {
        return filesProcesses;
    } else {
        const index = findFileProcessIndex(filesProcesses, id);
        if (index < 0) {
            return filesProcesses;
        } else {
            return editFilesProcesses(filesProcesses, index, Object.assign({}, filesProcesses[index], fp));
        }
    }
}

/**
 * Full processing progress:
 * - file added: isArchived: false, isUploaded: false
 * - file starts to compress: isArchived: false, isArchiving: true, isUploaded: false
 * - file compressed: isArchived: true, isArchiving: false, isUploaded: false
 * - file starts to upload: isUploading: true, operationId: !null
 * - file upload operation id got: isUploading: true, operationId: !null
 * - file uploaded: isUploaded: true
 * @param {File} file
 * @param {number} id
 * @returns {{progressValueFromAS: number, progressStatusFromAS: null, operationId: null, isUploading: boolean, file: *, error: null, isArchived: boolean, isArchiving: boolean, isUploaded: boolean}}
 */
function createFileProcess(file, id) {
    return {
        id: id,
        progressValueFromAS: 0,
        progressStatusFromAS: null,
        operationId: null,
        isUploading: false,
        file: file,
        error: null,
        isArchived: false,
        isArchiving: false,
        isUploaded: false
    };
}

/**
 * @template {FP}
 * @param {Array.<FP>} filesProcesses
 * @param {Array.<{file: File, id: number}>} newFiles
 */
function addFilesProcesses(filesProcesses, newFiles) {
    return [
        ...filesProcesses,
        ...newFiles.map((item) => createFileProcess(item.file, item.id))
    ];
}


export default function fileUpload(state = initialState, action) {

    switch (action.type) {

        case ActionTypes.CLEAR_UPLOAD_STATE: {
            return Object.assign({}, initialState, {
                filesProcesses: []
            });
        }
        case ActionTypes.REQUEST_GZIP: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    isArchiving: true
                })
            };
        }
        case ActionTypes.RECEIVE_GZIP: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    isArchiving: false
                })
            };
        }
        case ActionTypes.FILE_UPLOAD_ERROR: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    error: action.error
                })
            };
        }
        case ActionTypes.ADD_NOGZIPPED_FOR_UPLOAD: {
            return Object.assign({}, state, {
                filesProcesses: addFilesProcesses(state.filesProcesses, action.files)
            });
        }
        case ActionTypes.ADD_GZIPPED_FILE_FOR_UPLOAD: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    file: action.file,
                    isArchived: true
                })
            };
        }
        case ActionTypes.REQUEST_FILE_UPLOAD: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    isUploading: true
                })
            };
        }
        case ActionTypes.RECEIVE_FILE_UPLOAD: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    isUploading: false,
                    isUploaded: true
                })
            };
        }
        case  ActionTypes.RECEIVE_FILE_OPERATION: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    operationId: action.operationId
                })
            };
        }
        case ActionTypes.FILE_UPLOAD_CHANGE_PROGRESS: {
            return {
                filesProcesses: assignFileProcess(state.filesProcesses, action.id, {
                    progressValueFromAS: action.progressValueFromAS,
                    progressStatusFromAS: action.progressStatusFromAS
                })
            };
        }
        default:
            return state;

    }
}
