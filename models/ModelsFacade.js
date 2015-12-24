'use strict';

const LanguModel = require('./LanguModel');
const ViewsModel = require('./ViewsModel');
const UserModel = require('./UserModel');

const Config = require('../utils/Config');

class ModelsFacade {
    constructor() {
        this.config = Config;

        this.langu = new LanguModel(this);
        this.views = new ViewsModel(this);
        this.user = new UserModel(this);
    }
}