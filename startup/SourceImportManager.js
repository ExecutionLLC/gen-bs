'use strict';

const _ = require('lodash');

const Promise = require('bluebird');

class SourceImportManager {
    constructor(config, applicationServerService, sampleModel, fieldsMetadataModel) {
        this.config = config;
        this.sample = sampleModel;
        this.fieldsMetadata = fieldsMetadataModel;
        this.applicationServer = applicationServerService;

        this.onSourcesListReceived = this.onSourcesListReceived.bind(this);

        this.applicationServer.on(this.applicationServer.events.sourcesListReceived, this.onSourcesListReceived);
    }

    startImport() {
        return new Promise((resolve, reject) => {

        });
    }

    onSourcesListError(error) {
        console.error(error);
    }

    onSourcesListReceived(sourcesList) {

    }
}

module.exports = SourceImportManager;