'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class UserEntityControllerBase extends ControllerBase {
    constructor(services, theService) {
        super(services);

        this.theService = theService;

        this.find = this.find.bind(this);
        this.findAll = this.findAll.bind(this);
        this.add = this.add.bind(this);
        this.update = this.update.bind(this);
    }

    find(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const itemId = request.params.id;
        this.theService.find(user, itemId, (error, item) => {
            this.sendErrorOrJson(response, error, item);
        });
    }

    findAll(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        this.theService.findAll(user, (error, items) => {
            this.sendErrorOrJson(response, error, items);
        });
    }

    update(request, response) {
        if (!this.checkUserIsDefined(request)) {
            return;
        }

        const user = request.user;
        const itemId = request.params.id ;
        const item = this.getRequestBody(request, response);
        if (!item) {
            return;
        }

        item.id = itemId;

        this.theService.update(user, item, (error, updatedItem) => {
            this.sendErrorOrJson(response, error, updatedItem);
        });
    }

    add(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const languId = request.languId;
        const user = request.user;
        const item = this.getRequestBody(request, response);
        if (!item) {
            return;
        }
        this.theService.add(user, languId, item, (error, insertedItem) => {
            this.sendErrorOrJson(response, error, insertedItem);
        });
    }

    remove(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const itemId = request.params.id;
        this.theService.remove(user, itemId, (error, item) => {
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
