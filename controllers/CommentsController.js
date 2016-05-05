'use strict';

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class CommentsController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.comments);
    }
}

module.exports = CommentsController;
