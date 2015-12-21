'use strict';

const ViewsModel = require('./ViewsModel');
const SamplesModel = require('./SamplesModel');
const FieldsMetadataModel = require('./FieldsMetadataModel');

class ModelsFacade {
    constructor() {
        this.views = new ViewsModel();
        this.fields = new FieldsMetadataModel();
    }
}

module.exports = ModelsFacade;
