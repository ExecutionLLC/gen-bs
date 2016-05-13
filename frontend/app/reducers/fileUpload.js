import * as ActionTypes from '../actions/fileUpload'

const initialState = {
    progressValueFromAS: 0,
    progressStatusFromAS: null,
    operationId: null,
    isFetching: false,
    files: [],
    error: null,
    isArchiving: false,
    filesProcesses: []
};

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
 * @param {number|null} index - null, undefined or <0 - return filesProcesses
 * @param {FP} newFileProcess
 * @returns {Array.<FP>}
 */
function editFilesProcessesIfIndex(filesProcesses, index, newFileProcess) {
    if (index == null || index < 0) {
        return filesProcesses;
    } else {
        return editFilesProcesses(filesProcesses, index, newFileProcess);
    }
}

function createFileProcess(file) {
    return {
        progressValueFromAS: 0,
        progressStatusFromAS: null,
        operationId: null,
        isFetching: false,
        file: file,
        error: null,
        isArchiving: false,
        isUploaded: false
    };
}

/**
 * @template {FP}
 * @param {Array.<FP>} filesProcesses
 * @param {Array.<File>} newFiles
 */
function addFilesProcesses(filesProcesses, newFiles) {
    return [
        ...filesProcesses,
        ...newFiles.map((file) => createFileProcess(file))
    ];
}


export default function fileUpload(state = initialState, action) {

    switch (action.type) {

        case ActionTypes.CLEAR_UPLOAD_STATE:
        {
            return Object.assign({}, initialState, {
                filesProcesses: state.filesProcesses
            });
        }
        case ActionTypes.REQUEST_GZIP:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    isArchiving: true
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            isArchiving: true
                        })
                    )
                });
            }
        }
        case ActionTypes.RECEIVE_GZIP:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    isArchiving: false
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            isArchiving: false
                        })
                    )
                });
            }
        }
        case ActionTypes.FILE_UPLOAD_ERROR:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    files: [],
                    error: action.msg
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            msg: action.msg
                        })
                    )
                });
            }
        }
        case ActionTypes.ADD_NOGZIPPED_FOR_UPLOAD:
        {
            return Object.assign({}, state, {
                filesProcesses: addFilesProcesses(state.filesProcesses, action.files)
            });
        }
        case ActionTypes.ADD_GZIPPED_FILE_FOR_UPLOAD:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    files: action.files,
                    error: null
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            error: null
                        })
                    )
                });
            }
        }
        case ActionTypes.REQUEST_FILE_UPLOAD:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    isFetching: true
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            isFetching: true
                        })
                    )
                });
            }
        }
        case ActionTypes.RECEIVE_FILE_UPLOAD:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    isFetching: false
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            isFetching: false
                        })
                    )
                });
            }
        }
        case  ActionTypes.RECEIVE_FILE_OPERATION:
        {
            if (action.index == null) {
                return Object.assign({}, state, {
                    operationId: action.operationId
                });
            } else {
                return Object.assign({}, state, {
                    filesProcesses: editFilesProcesses(
                        state.filesProcesses,
                        action.index,
                        Object.assign({}, state.filesProcesses[action.index], {
                            operationId: action.operationId
                        })
                    )
                });
            }
        }

        case ActionTypes.FILE_UPLOAD_CHANGE_PROGRESS:
        {
            return Object.assign({}, state, {
                progressValueFromAS: action.progressValueFromAS,
                progressStatusFromAS: action.progressStatusFromAS
            });
        }
        default:
            return state

    }
}
