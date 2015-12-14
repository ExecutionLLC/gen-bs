'use strict';

const UserDataController = require('./UserDataController');
const DemoUserDataController = require('./DemoUserDataController');

const ViewController = require('./ViewController');
const FilterController = require('./FilterController');

const LoginController = require('./LoginController');
const SearchController = require('./SearchController');

class ControllersFacade {
    constructor(services) {
        this.userDataController = new UserDataController(services);
        this.demoUserDataController = new DemoUserDataController(services);
        this.viewController = new ViewController(services);
        this.filterController = new FilterController(services);
        this.loginController = new LoginController(services);
        this.searchController = new SearchController(services);
    }
}

module.exports = ControllersFacade;
