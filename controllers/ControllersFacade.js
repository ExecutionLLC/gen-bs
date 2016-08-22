'use strict';

const DataController = require('./DataController');

const SampleController = require('./SampleController');
const ViewController = require('./ViewController');
const FilterController = require('./FilterController');
const CommentsController = require('./CommentsController');
const FieldsMetadataController = require('./FieldsMetadataController');
const SavedFilesController = require('./SavedFilesController');
const QueryHistoryController = require('./QueryHistoryController');
const SampleUploadHistoryController = require('./SampleUploadHistoryController');

const SearchController = require('./SearchController');

const WSController = require('./WSController');
const SessionsController = require('./SessionsController');
const ApiController = require('./ApiController');

class ControllersFacade {
    constructor(logger, services) {
        this.logger = logger;

        this.dataController = new DataController(services);

        this.commentsController = new CommentsController(services);
        this.samplesController = new SampleController(services);
        this.viewsController = new ViewController(services);
        this.filtersController = new FilterController(services);
        this.fieldsMetadataController = new FieldsMetadataController(services);
        this.savedFilesController = new SavedFilesController(services);
        this.queryHistoryController = new QueryHistoryController(services);
        this.sampleUploadHistoryController = new SampleUploadHistoryController(services);

        this.searchController = new SearchController(services);
        this.sessionsController = new SessionsController(services);

        this.wsController = new WSController(services);
        this.apiController = new ApiController(services);
    }
}

module.exports = ControllersFacade;
