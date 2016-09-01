'use strict';

const assert = require('assert');
const fs = require('fs');
const _ = require('lodash');
const Uuid = require('node-uuid');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const SavedFilesClient = require('./utils/SavedFilesClient');
const SamplesClient = require('./utils/SamplesClient');
const ClientBase = require('./utils/ClientBase');

const DefaultViews = require('../database/defaults/views/default-views.json');
const DefaultFilters = require('../database/defaults/filters/default-filters.json');
const Sample = require('../database/defaults/samples/DefaultSample.json').sample;

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const savedFilesClient = new SavedFilesClient(urls);
const samplesClient = new SamplesClient(urls);
const JsonValidator = require('../utils/JsonValidator');

const testFilePath = __dirname + '/mocks/test-saved-file.csv';

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};
const languId = Config.defaultLanguId;
const testViewId = DefaultViews[0].id;
const testFilterId = DefaultFilters[0].id;
const validator = new JsonValidator();

const generateFileMetadata = (sampleId) => {
    return {
        sampleId,
        viewId: testViewId,
        filterIds: [testFilterId],
        name: 'TestExport_' + Uuid.v4(),
        url: '',
        totalResults: 100500,
        languId: languId,
        description: 'Test upload'
    };
};

const checkFileMetadataEqual = (file1, file2) => {
    assert.equal(file1.name, file2.name);
    assert.equal(file1.url, file2.url);
    assert.equal(file1.totalResults, file2.totalResults);
    assert.equal(file1.languId, file2.languId);
    assert.equal(file1.description, file2.description);
};

describe('Fields', () => {
    let sessionId = null;
    let sampleId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response);
            done();
        });
    });


    it('should correctly get field Metadata exported file', (done) => {
        samplesClient.getAllFields(sessionId, (error, response) => {
            const fieldsMetadata = ClientBase.readBodyWithCheck(error, response);
            assert(validator.getValidateGetFieldsMetadata(fieldsMetadata));

            done();
        });
    });

    // it('should list all available files.', (done) => {
    //     savedFilesClient.getAll(sessionId, (error, response) => {
    //         const savedFiles = ClientBase.readBodyWithCheck(error, response);
    //         assert(validator.getValidateGetSavedFilesAnswer(savedFiles));
    //         done();
    //     });
    // });

});
