'use strict';

const async = require('async');

class MockUsersController {
    constructor(usersController) {
        this.originalUsersController = usersController;
        this.originalAdd = usersController.add;
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
        async.waterfall([
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const languId = request.languId;
                const {user, key} = item;
                if (key === this.config.regserver.ADD_USER_KEY) {
                    this.services.users.update(user.id, languId, user, callback);
                } else {
                    callback('Invalid update user key');
                }
            }
        ], (error, insertedItem) => {
            this.sendErrorOrJson(response, error, insertedItem);
        });
    }

    createRouter() {
        const router = this.originalCreateRouter.call(this.originalUsersController);
        router.put('/', this.update.bind(this.originalUsersController));
        return router;
    }
}

module.exports = MockUsersController;