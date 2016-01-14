'use strict';

const UsersService = require('./UsersService');
const ViewsService = require('./ViewsService');
const FiltersService = require('./FiltersService');
const SamplesService = require('./SamplesService');
const RedisService = require('./RedisService');
const SessionService = require('./SessionService');
const OperationService = require('./OperationsService');
const FieldsMetadataService = require('./FieldsMetadataService');
const ApplicationServerService = require('./ApplicationServerService');
const ApplicationServerReplyService = require('./ApplicationServerReplyService');
const SearchService = require('./SearchService');
const TokenService = require('./TokenService');

class ServiceFacade {
  constructor(config, logger, models) {
    this.config = config;
    this.logger = logger;

    this.views = new ViewsService(this, models);
    this.filters = new FiltersService(this, models);
    this.users = new UsersService(this, models);
    this.samples = new SamplesService(this, models);
    this.sessions = new SessionService(this, models);
    this.operations = new OperationService(this, models);
    this.applicationServer = new ApplicationServerService(this, models);
    this.applicationServerReply = new ApplicationServerReplyService(this, models);
    this.fieldsMetadata = new FieldsMetadataService(this, models);
    this.search = new SearchService(this, models);
    this.redis = new RedisService(this, models);
    this.tokens = new TokenService(this, models);
  }
}

module.exports = ServiceFacade;
