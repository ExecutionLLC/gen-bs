'use strict';

const async = require('async');

class MockUsersController {
    constructor(usersController) {
        this.originalUsersController = usersController;
        this.originalAdd = usersController.add;
        this.originalUpdate = usersController.update;
        this.originalCreateRouter = usersController.createRouter;//.bind(usersController);
        usersController.add = this.add.bind(this);
        usersController.update = this.update.bind(this);
        usersController.createRouter = this.createRouter.bind(this);
        return usersController;
    }

    add(request, response) {
        this.originalAdd.call(this.originalUsersController, request, response);
    }

    update(request, response) {
        this.originalUpdate.call(this.originalUsersController, request, response);
    }

    createRouter() {
        const router = this.originalCreateRouter.call(this.originalUsersController);
        router.post('/', this.add.bind(this.originalUsersController));
        router.put('/', this.update.bind(this.originalUsersController));
        return router;
    }
}

module.exports = MockUsersController;