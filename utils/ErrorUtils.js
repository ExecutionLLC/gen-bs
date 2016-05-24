'use strict';

const _ = require('lodash');

const INTERNAL_ERROR_CODE = 500;

class ErrorUtils {
    static createErrorMessage(error) {
        if (!error) {
            return 'Operation successful';
        }

        let message = '';
        if (_.isObject(error)) {
            if (error.message) {
                message = error.message;
                if (error.stack) {
                    message += '\n' + error.stack;
                }
            } else {
                message = JSON.stringify(error);
            }
        } else if (typeof error === 'string') {
            message = error;
        } else {
            message = error.toString();
        }
        return message;
    }
    
    static createInternalError(message) {
        message = this.createErrorMessage(message);
        return {
            code: INTERNAL_ERROR_CODE,
            message
        }
    }
}

module.exports = ErrorUtils;
