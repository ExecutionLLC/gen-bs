'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class UserEntityControllerBase extends ControllerBase {
    constructor(services, theService) {
        super(services);

        this.theService = theService;

        this.find = this.find.bind(this);
        this.findAll = this.findAll.bind(this);
        this.update = this.update.bind(this);
        this.add = this.add.bind(this);
    }

    find(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const itemId = request.params.id;
        this.theService.find(user, itemId, (error, item) => {
           if (error) {
               this.sendInternalError(response, error);
           } else {
               this.sendJson(response, item);
           }
        });
    }

    findAll(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        this.theService.findAll(user, (error, views) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, views);
            }
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
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, updatedItem);
            }
        });
    }

    add(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const item = this.getRequestBody(request, response);
        if (!item) {
            return;
        }
        this.theService.add(user, item, (error, insertedItem) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, insertedItem);
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.findAll);
        router.get('/:id', this.find);
        router.put('/:id', this.update);
        router.post('/', this.add);

        return router;
    }
}

module.exports = UserEntityControllerBase;
