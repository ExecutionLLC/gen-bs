'use strict';

const ViewsModel = require('./ViewsModel');

class ModelsFacade {
    constructor(config) {
        this.config = config;

        this.views = new ViewsModel(this);
    }
}