'use strict';

const ViewsModel = require('./ViewsModel');
const SamplesModel = require('./SamplesModel');
const FiltersModel = require('./FiltersModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');

class ModelsFacade {
    constructor() {
        this.views = new ViewsModel();
        this.samples = new SamplesModel();
        this.filters = new FiltersModel();
        this.fields = new FieldsMetadataModel();
    }
}

module.exports = ModelsFacade;
