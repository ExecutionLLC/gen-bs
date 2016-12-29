'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class UserEntityControllerBase extends ControllerBase {
    constructor(services, theService) {
        super(services);

        this.theService = theService;

        this.find = this.find.bind(this);
        this.findAll = this.findAll.bind(this);
        this.add = this.add.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    find(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const itemId = request.params.id;
                this.theService.find(user, itemId, callback);
            }
        ], (error, item) => {
            this.sendErrorOrJson(response, error, item);
        });
    }

    findAll(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                this.theService.findAll(user, callback);
            }
        ], (error, items) => {
            this.sendErrorOrJson(response, error, items);
        });
    }

    update(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const user = request.user;
                item.id = request.params.id;
                this.theService.update(user, item, callback);
            }
        ], (error, updatedItem) => {
            this.sendErrorOrJson(response, error, updatedItem);
        });
    }

    add(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const languageId = request.languId;
                const user = request.user;
                this.theService.add(user, languageId, item, callback);
            }
        ], (error, insertedItem) => {
            this.sendErrorOrJson(response, error, insertedItem);
        });
    }

    remove(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const itemId = request.params.id;
                this.theService.remove(user, itemId, callback);
            }
        ], (error, item) => {
            this.sendErrorOrJson(response, error, item);
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.findAll);
        router.get('/:id', this.find);
        router.put('/:id', this.update);
        router.post('/', this.add);
        router.delete('/:id', this.remove);

        return router;
    }
}

module.exports = UserEntityControllerBase;
