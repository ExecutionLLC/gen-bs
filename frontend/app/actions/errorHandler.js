export const HANDLE_ERROR = 'HANDLE_ERROR';
export const LAST_ERROR_RESOLVED = 'LAST_ERROR_RESOLVED';

export function handleError(errorCode, errorMessage) {
    return {
        type: HANDLE_ERROR,
        error: { errorCode, errorMessage }
    }
}

export function lastErrorResolved() {
    return {
        type: LAST_ERROR_RESOLVED
    }
}
