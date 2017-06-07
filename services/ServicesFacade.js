'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('./ServiceBase');
const LanguageService = require('./LanguageService');
const KeywordsService = require('./KeywordsService');
const UsersService = require('./UsersService');
const ViewsService = require('./ViewsService');
const FiltersService = require('./FiltersService');
const CommentsService = require('./CommentsService');
const SamplesService = require('./SamplesService');
const SessionService = require('./SessionService');
const OperationService = require('./OperationsService');
const FieldsService = require('./FieldsService');
const MetadataService = require('./MetadataService');
const SearchService = require('./SearchService');
const SchedulerService = require('./tasks/SchedulerService');
const SavedFilesService = require('./SavedFilesService');
const AnalysisService = require('./AnalysisService');
const SampleUploadHistoryService = require('./SampleUploadHistoryService');
const UserDataService = require('./UserDataService');
const ObjectStorageService = require('./ObjectStorageService');
const ModelsService = require('./ModelsService');
const EventsService = require('./EventsService');


const ApplicationServerService = require('./external/applicationServer/ApplicationServerService');
const ApplicationServerReplyService = require('./external/applicationServer/ApplicationServerReplyService');
const AppServerUploadService = require('./external/applicationServer/AppServerUploadService');
const AppServerSourcesService = require('./external/applicationServer/AppServerSourcesService');
const AppServerOperationsService = require('./external/applicationServer/AppServerOperationsService');
const AppServerSearchService = require('./external/applicationServer/AppServerSearchService');

class ServiceFacade {
    constructor(config, logger, models) {
        this.config = config;
        this.logger = logger;

        this.language = new LanguageService(this, models);
        this.keywords = new KeywordsService(this, models);
        this.views = new ViewsService(this, models);
        this.filters = new FiltersService(this, models);
        this.users = new UsersService(this, models);
        this.comments = new CommentsService(this, models);
        this.samples = new SamplesService(this, models);
        this.fields = new FieldsService(this, models);
        this.metadata = new MetadataService(this, models);
        this.savedFiles = new SavedFilesService(this, models);
        this.analysis = new AnalysisService(this, models);
        this.sampleUploadHistory = new SampleUploadHistoryService(this, models);
        this.userData = new UserDataService(this, models);
        this.search = new SearchService(this, models);
        this.models = new ModelsService(this, models);
        this.events = new EventsService(this, models);

        this.sessions = new SessionService(this, models);
        this.operations = new OperationService(this, models);

        this.applicationServer = new ApplicationServerService(this, models);
        this.applicationServerUpload = new AppServerUploadService(this, models);
        this.applicationServerSources = new AppServerSourcesService(this, models);
        this.applicationServerOperations = new AppServerOperationsService(this, models);
        this.applicationServerReply = new ApplicationServerReplyService(this, models);
        this.applicationServerSearch = new AppServerSearchService(this, models);

        this.objectStorage = new ObjectStorageService(this, models);

        this.scheduler = new SchedulerService(this, models);

        _.map(this)
            .filter(service => service instanceof ServiceBase)
            .forEach(service => service.init());
    }

    start(callback){
        const serviceBaseInstances = _.map(this).filter(service => service instanceof ServiceBase);
        async.forEach(serviceBaseInstances, (service, callback) => service.start(callback), callback);
    }

    stop(callback){
        const serviceBaseInstances = _.map(this).filter(service => service instanceof ServiceBase);
        async.forEach(serviceBaseInstances, (service, callback) => service.stop(callback), callback);
    }
}

module.exports = ServiceFacade;
