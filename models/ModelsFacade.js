'use strict';

const LanguModel = require('./LanguModel');
const UserModel = require('./UserModel');
const ViewsModel = require('./ViewsModel');
const ViewItemsModel = require('./ViewItemsModel');
const KeywordsModel = require('./KeywordsModel');
const SynonymsModel = require('./SynonymsModel');
const FiltersModel = require('./FiltersModel');
const SamplesModel = require('./SamplesModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');

class ModelsFacade {
    constructor() {
        this.langu = new LanguModel(this);
        this.user = new UserModel(this);
        this.views = new ViewsModel(this);
        this.viewItems = new ViewItemsModel(this);
        this.keywords = new KeywordsModel(this);
        this.synonyms = new SynonymsModel(this);
        this.filters = new FiltersModel(this);
        this.samples = new SamplesModel();
        this.fields = new FieldsMetadataModel();
    }
}

module.exports = ModelsFacade;
