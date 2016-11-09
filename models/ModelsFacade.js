'use strict';

const KnexWrapper = require('../utils/KnexWrapper');

const LanguageModel = require('./LanguageModel');
const UserModel = require('./UserModel');
const ViewsModel = require('./ViewsModel');
const KeywordsModel = require('./KeywordsModel');
const FiltersModel = require('./FiltersModel');
const SamplesModel = require('./SamplesModel');
const CommentsModel = require('./CommentsModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');
const SavedFileModel = require('./SavedFileModel');
const AnalysisModel = require('./AnalysisModel');
const ModelsModel = require('./ModelsModel');
const EventsModel = require('./EventsModel');

class ModelsFacade {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;

        // KnexWrapper instance should only be created once for ModelsFacade
        this.db = new KnexWrapper(config, logger);

        this.langu = new LanguageModel(this);
        this.users = new UserModel(this);
        this.keywords = new KeywordsModel(this);
        this.views = new ViewsModel(this);
        this.filters = new FiltersModel(this);
        this.samples = new SamplesModel(this);
        this.fields = new FieldsMetadataModel(this);
        this.comments = new CommentsModel(this);
        this.savedFiles = new SavedFileModel(this);
        this.analysis = new AnalysisModel(this);
        this.models = new ModelsModel(this);
        this.events = new EventsModel(this);
    }
}

module.exports = ModelsFacade;
