'use strict';

const ViewsModel = require('./ViewsModel');

const Config = require('../utils/Config');

class ModelsFacade {
    constructor() {
        this.config = Config;

        this.views = new ViewsModel(this);
    }
}