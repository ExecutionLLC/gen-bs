'use strict';

const UsersService = require('./UsersService');
const ViewsService = require('./ViewsService');
const FiltersService = require('./FiltersService');
const SamplesService = require('./SamplesService');
const FieldsMetadataService = require('./FieldsMetadataService');
const ApplicationServerService = require('./ApplicationServerService');
const SearchService = require('./SearchService');

class ServiceFacade {
  constructor() {
    this.views = new ViewsService(this);
    this.filters = new FiltersService(this);
    this.users = new UsersService(this);
    this.samples = new SamplesService(this);
    this.applicationServer = new ApplicationServerService(this);
    this.fieldsMetadata = new FieldsMetadataService(this);
    this.search = new SearchService(this);
  }
}

module.exports = ServiceFacade;
