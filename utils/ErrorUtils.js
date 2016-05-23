'use strict';

const _ = require('lodash');

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
}

module.exports = ErrorUtils;
