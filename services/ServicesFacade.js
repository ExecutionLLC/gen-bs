'use strict';

const LanguService = require('./LanguService');
const KeywordsService = require('./KeywordsService');
const UsersService = require('./UsersService');
const ViewsService = require('./ViewsService');
const FiltersService = require('./FiltersService');
const CommentsService = require('./CommentsService');
const SamplesService = require('./SamplesService');
const RedisService = require('./RedisService');
const SessionService = require('./SessionService');
const OperationService = require('./operations/OperationsService');
const FieldsMetadataService = require('./FieldsMetadataService');
const ApplicationServerService = require('./ApplicationServerService');
const ApplicationServerReplyService = require('./ApplicationServerReplyService');
const SearchService = require('./SearchService');
const TokenService = require('./TokenService');
const SchedulerService = require('./tasks/SchedulerService');

class ServiceFacade {
    constructor(config, logger, models) {
        this.config = config;
        this.logger = logger;

        this.langu = new LanguService(this, models);
        this.keywords = new KeywordsService(this, models);
        this.views = new ViewsService(this, models);
        this.filters = new FiltersService(this, models);
        this.users = new UsersService(this, models);
        this.comments = new CommentsService(this, models);
        this.samples = new SamplesService(this, models);
        this.fieldsMetadata = new FieldsMetadataService(this, models);

        this.sessions = new SessionService(this, models);
        this.operations = new OperationService(this, models);

        this.applicationServer = new ApplicationServerService(this, models);
        this.applicationServerReply = new ApplicationServerReplyService(this, models);

        this.redis = new RedisService(this, models);
        this.search = new SearchService(this, models);
        this.tokens = new TokenService(this, models);

        this.scheduler = new SchedulerService(this, models);
        this.scheduler.start();
    }
}

module.exports = ServiceFacade;
