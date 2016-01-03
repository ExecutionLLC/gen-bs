'use strict';

const Logger = require('./utils/Logger');

const LanguModel = require('./LanguModel');
const UserModel = require('./UserModel');
const ViewsModel = require('./ViewsModel');
const KeywordsModel = require('./KeywordsModel');
const FiltersModel = require('./FiltersModel');
const SamplesModel = require('./SamplesModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');

class ModelsFacade {
    constructor(config) {
        this.logger = new Logger(config.logger);

        this.langu = new LanguModel(this);
        this.user = new UserModel(this);
        this.keywords = new KeywordsModel(this);
        this.views = new ViewsModel(this);
        this.filters = new FiltersModel(this);
        this.samples = new SamplesModel(this);
        this.fields = new FieldsMetadataModel(this);
    }
}

module.exports = ModelsFacade;
