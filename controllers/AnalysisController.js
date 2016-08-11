const async = require('async');

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class AnalysisController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.analysis)
    }

    findAll(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const limit = request.query.limit;
                const offset = request.query.offset;
                const nameFilter = request.query.name;
                const descriptionFilter = request.query.description;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified or incorrect'));
                } else {
                    this.services.queryHistory.findAll(
                        user, limit, offset,nameFilter, descriptionFilter, callback
                    );
                }
            }
        ], (error, result) => {
            this.sendErrorOrJson(response, error, {result});
        });
    }

    find(request, response) {
        this.sendInternalError(response, new Error('not supported'));
    }

    add(request, response) {
        this.sendInternalError(response, new Error('not supported'));
    }
}

module.exports = AnalysisController;