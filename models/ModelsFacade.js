'use strict';

const LanguModel = require('./LanguModel');
const UserModel = require('./UserModel');
const ViewsModel = require('./ViewsModel');
const KeywordsModel = require('./KeywordsModel');
const FiltersModel = require('./FiltersModel');
const SamplesModel = require('./SamplesModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');

class ModelsFacade {
    constructor() {
        this.langu = new LanguModel(this);
        this.user = new UserModel(this);
        this.views = new ViewsModel(this);
        this.keywords = new KeywordsModel(this);
        this.filters = new FiltersModel(this);
        this.samples = new SamplesModel();
        this.fields = new FieldsMetadataModel();
    }
}

module.exports = ModelsFacade;
