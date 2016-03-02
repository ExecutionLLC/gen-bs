'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class CommentsController extends ControllerBase {
    constructor(services) {
        super(services)
    }

    createRouter() {

    }
}

module.exports = CommentsController;
