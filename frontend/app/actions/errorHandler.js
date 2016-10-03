import HttpStatus from 'http-status';

export const HANDLE_ERROR = 'HANDLE_ERROR';
export const LAST_ERROR_RESOLVED = 'LAST_ERROR_RESOLVED';

export class NetworkError extends Error {
    constructor(message) {
        super(message || 'Network error');
    }
}

export class WebServerError extends Error {
    constructor(message) {
        super(message || 'WebServer error');
    }
}

export function handleError(errorCode, errorMessage) {
    console.error(`Handing error code: ${errorCode}, message: ${errorMessage}`);
    return {
        type: HANDLE_ERROR,
        error: {errorCode, errorMessage}
    };
}

export function lastErrorResolved() {
    return {
        type: LAST_ERROR_RESOLVED
    };
}

export function handleApiResponseErrorAsync(errorMessage, apiCallError, response) {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            let error = null;
            if (apiCallError) {
                error = new NetworkError(apiCallError.message);
            } else if (response.status !== HttpStatus.OK) {
                error = new WebServerError(response.body);
            }

            if (error) {
                dispatch(handleError(null, `${errorMessage} Reason: ${error.message}`));
                reject(error);
            } else {
                resolve(response);
            }
        });
    };
}
