'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');

class AppServerSourcesService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
    }

    requestSourcesList(callback) {
        const method = METHODS.getSourcesList;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, null, callback)
        ], callback);
    }

    requestSourceMetadata(sourceNames, callback) {
        const method = METHODS.getSourceMetadata;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, _.map(sourceNames, (sourceName) => {
                return sourceName + '.h5'
            }), callback)
        ], callback);
    }
}

module.exports = AppServerSourcesService;
