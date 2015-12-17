'use strict';

const UsersService = require('./UsersService');
const ViewsService = require('./ViewsService');
const FiltersService = require('./FiltersService');
const SamplesService = require('./SamplesService');
const SessionService = require('./SessionService');
const WSService = require('./WSService');
const FieldsMetadataService = require('./FieldsMetadataService');
const ApplicationServerService = require('./ApplicationServerService');

class ServiceFacade {
  constructor(config) {
    this.config = config;
    this.views = new ViewsService(this);
    this.filters = new FiltersService(this);
    this.users = new UsersService(this);
    this.samples = new SamplesService(this);
    this.sessionService = new SessionService(this);
    this.wsService = new WSService(this);
    this.applicationServer = new ApplicationServerService(this);
    this.fieldsMetadata = new FieldsMetadataService(this);
  }
}

module.exports = ServiceFacade;
