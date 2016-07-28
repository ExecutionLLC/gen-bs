const async = require('async');

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class AnalysisController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.analysis)
    }

    findAll(request, response) {
        this.sendInternalError(response, new Error('not supported'));
    }

    find(request, response) {
        this.sendInternalError(response, new Error('not supported'));
    }

    add(request, response) {
        this.sendInternalError(response, new Error('not supported'));
    }
}

module.exports = AnalysisController;