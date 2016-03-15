'use strict';

const UserEntityControllerBase = require('./UserEntityControllerBase');

class CommentsController extends UserEntityControllerBase {
    constructor(services) {
        super(services, services.comments);
    }
}

module.exports = CommentsController;
