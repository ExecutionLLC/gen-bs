'use strict';

const assert = require('assert');
const fs = require('fs');
const _ = require('lodash');
const Uuid = require('node-uuid');

const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const SessionsClient = require('./utils/SessionsClient');
const SavedFilesClient = require('./utils/SavedFilesClient');
const ClientBase = require('./utils/ClientBase');

const DefaultViews = require('../defaults/views/default-views.json');
const DefaultFilters = require('../defaults/filters/default-filters.json');
const Sample = require('../defaults/samples/Sample_vcf4.1.vcf.gz.json').sample;

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const savedFilesClient = new SavedFilesClient(urls);

const testFilePath = __dirname + '/mocks/test-saved-file.csv';

const TestUser = {
    userEmail: 'valarievaughn@electonic.com'
};
const languId = Config.defaultLanguId;
const testViewId = DefaultViews[0].id;
const testFilterId = DefaultFilters[0].id;

const generateFileMetadata = () => {
    return {
        sampleId: Sample.id,
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
    assert.equal(file1.viewId, file2.viewId);
    assert.deepEqual(file1.filterIds, file2.filterIds);
    assert.equal(file1.name, file2.name);
    assert.equal(file1.url, file2.url);
    assert.equal(file1.totalResults, file2.totalResults);
    assert.equal(file1.languId, file2.languId);
    assert.equal(file1.description, file2.description);
};

describe('Saved Files', () => {
    let sessionId = null;

    before((done) => {
        sessionsClient.openSession(TestUser.userEmail, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);
            sessionId = SessionsClient.getSessionFromResponse(response);

            done();
        });
    });

    it('should correctly upload exported file', (done) => {
        const fileStream = fs.createReadStream(testFilePath);
        const fileMetadata = generateFileMetadata();
        savedFilesClient.add(languId, sessionId, fileMetadata, fileStream, (error, response) => {
            const insertedFileMetadata = ClientBase.readBodyWithCheck(error, response);
            assert.ok(insertedFileMetadata.id);
            checkFileMetadataEqual(fileMetadata, insertedFileMetadata);

            done();
        });
    });
});
