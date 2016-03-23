export const HANDLE_ERROR = 'HANDLE_ERROR';
export const LAST_ERROR_RESOLVED = 'LAST_ERROR_RESOLVED';

export function handleError(errorCode, errorMessage, errorActions) {
    return {
        type: HANDLE_ERROR,
        error: { errorCode, errorMessage, errorActions } 
    }
}

export function lastErrorResolved() {
    return {
        type: LAST_ERROR_RESOLVED
    }
}
