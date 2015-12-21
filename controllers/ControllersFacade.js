'use strict';

const DataController = require('./DataController');
const DemoDataController = require('./DemoDataController');

const ViewController = require('./ViewController');
const FilterController = require('./FilterController');
const FieldsMetadataController = require('./FieldsMetadataController');

const LoginController = require('./LoginController');
const SearchController = require('./SearchController');

const TestController = require('./TestController');

const WSController = require('./WSController');
const ApiController = require('./ApiController');

class ControllersFacade {
    constructor(services) {
        this.dataController = new DataController(services);
        this.demoDataController = new DemoDataController(services);

        this.viewsController = new ViewController(services);
        this.filtersController = new FilterController(services);
        this.fieldsMetadataController = new FieldsMetadataController(services);

        this.loginController = new LoginController(services);
        this.searchController = new SearchController(services);

        this.wsController = new WSController(services);

        this.testController = new TestController(services);

        this.apiController = new ApiController(services);
    }
}

module.exports = ControllersFacade;
