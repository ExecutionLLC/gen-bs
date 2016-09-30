'use strict';

const AppServerNotRespondedCode = -300000;
const AppServerNotRespondedMessage = 'App server not responded';

class AppServerNotRespondedError extends Error {

    constructor() {
        super();
        this.code = AppServerNotRespondedCode;
        this.message = AppServerNotRespondedMessage;
    }
}

module.exports = AppServerNotRespondedError;
