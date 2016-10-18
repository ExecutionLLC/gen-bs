'use strict';

const APP_SERVER_NOT_RESPONDED_CODE = -300000;
const APP_SERVER_NOT_RESPONDED_MESSAGE = 'App server not responded';

class AppServerNotRespondedError extends Error {
    constructor() {
        super(APP_SERVER_NOT_RESPONDED_MESSAGE);
        this.code = APP_SERVER_NOT_RESPONDED_CODE;
    }
}

module.exports = AppServerNotRespondedError;
