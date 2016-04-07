'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class DataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getData = this.getData.bind(this);
    }

    getData(request, response) {
        const user = request.user;
        const sessionId = request.sessionId;
        async.parallel({
            profileMetadata: (callback) => callback(null, user),
            views: (callback) => {
                this.services.views.findAll(user, callback);
            },
            filters: (callback) => {
                this.services.filters.findAll(user, callback);
            },
            samples: (callback) => {
                this.services.samples.findAll(user, callback);
            },
            savedFiles: (callback) => {
                this.services.savedFiles.findAll(user, callback);
            },
            activeOperations: (callback) => {
                this.services.operations.findAll(sessionId, (error, operations) => {
                    const clientOperations = _.map(operations, operation => {
                        return {
                            id: operation.id,
                            type: operation.type
                        };
                    });
                    callback(error, clientOperations);
                });
            }
        }, (error, results) => {
            this.sendErrorOrJson(response, error, results);
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.getData);
        return router;
    }
}

module.exports = DataController;
