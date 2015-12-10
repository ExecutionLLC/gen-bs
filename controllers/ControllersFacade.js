'use strict';

const UserDataController = require('./UserDataController');
const DemoUserDataController = require('./DemoUserDataController');

const ViewController = require('./ViewController');
const FilterController = require('./FilterController');

const LoginController = require('./LoginController');
const SearchController = require('./SearchController');

class ControllersFacade {
    constructor() {
        this.userDataController = new UserDataController(this);
        this.demoUserDataController = new DemoUserDataController(this);
        this.viewController = new ViewController(this);
        this.filterController = new FilterController(this);
        this.loginController = new LoginController(this);
        this.searchController = new SearchController(this);
    }
}

module.exports = ControllersFacade;