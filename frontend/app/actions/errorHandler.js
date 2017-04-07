import HttpStatus from 'http-status';

export const HANDLE_ERROR = 'HANDLE_ERROR';
export const LAST_ERROR_RESOLVED = 'LAST_ERROR_RESOLVED';

export class NetworkError extends Error {
    constructor(message) {
        // This text must not be shown so it is not translated
        super(message || 'Please kindly check your network connection. If it is okay, please be sure we are already' +
            ' working on your issue. Sorry for the inconvenience.');
    }
}

export class WebServerError extends Error {
    constructor(message) {
        // This text must not be shown so it is not translated
        super(message || 'Our server has taken liberties to respond with error.' +
            ' Sorry for the inconvenience, we are working on fixing it.');
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

function handleApiResponseCheckBodyErrorAsync(errorMessage, apiCallError, response, mustHaveBody) {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            let error = null;
            if (apiCallError) {
                error = new NetworkError(apiCallError.message);
            } else if (mustHaveBody && !response.body) {
                error = new WebServerError(response.text);
            } else if (response.status !== HttpStatus.OK) {
                error = response.body ?
                    new WebServerError(response.body.message) :
                    new WebServerError(response.text);
            }
            if (error) {
                dispatch(handleError(null, errorMessage));
                reject(error);
            } else {
                resolve(response);
            }
        });
    };
}

export function handleApiResponseErrorAsync(errorMessage, apiCallError, response) {
    return handleApiResponseCheckBodyErrorAsync(errorMessage, apiCallError, response, true);
}

export function handleApiBodylessResponseErrorAsync(errorMessage, apiCallError, response) {
    return handleApiResponseCheckBodyErrorAsync(errorMessage, apiCallError, response, false);
}
