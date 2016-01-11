'use strict';

const DataController = require('./DataController');
const DemoDataController = require('./DemoDataController');

const SampleController = require('./SampleController');
const ViewController = require('./ViewController');
const FilterController = require('./FilterController');
const FieldsMetadataController = require('./FieldsMetadataController');

const SearchController = require('./SearchController');

const TestController = require('./TestController');

const WSController = require('./WSController');
const SessionsController = require('./SessionsController');
const ApiController = require('./ApiController');

class ControllersFacade {
    constructor(logger, services) {
        this.logger = logger;

        this.dataController = new DataController(services);
        this.demoDataController = new DemoDataController(services);

        this.samplesController = new SampleController(services);
        this.viewsController = new ViewController(services);
        this.filtersController = new FilterController(services);
        this.fieldsMetadataController = new FieldsMetadataController(services);

        this.searchController = new SearchController(services);
        this.sessionsController = new SessionsController(services);

        this.wsController = new WSController(services);

        this.testController = new TestController(services);

        this.apiController = new ApiController(services);
    }
}

module.exports = ControllersFacade;
