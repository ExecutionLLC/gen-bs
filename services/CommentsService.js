'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class CommentsService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.comments);
    }
}

module.exports = UserEntityServiceBase;
