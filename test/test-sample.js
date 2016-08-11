'use strict';

const assert = require('assert');
const _ = require('lodash');
const fs = require('fs');

const ClientBase = require('./utils/ClientBase');
const SessionsClient = require('./utils/SessionsClient');
const SamplesClient = require('./utils/SamplesClient');
const Config = require('../utils/Config');
const Urls = require('./utils/Urls');
const CollectionUtils = require('./utils/CollectionUtils');
const WebSocketClient = require('./utils/WebSocketClient');

const urls = new Urls('localhost', Config.port);
const sessionsClient = new SessionsClient(urls);
const samplesClient = new SamplesClient(urls);

const EditableFieldsTemplates = require('../database/defaults/templates/metadata/editable-metadata.json');
const TestUser = require('./mocks/mock-users.json')[1];

describe.skip('One Sample', function () {
    this.timeout(30000);
    let sessionId = null;
    let webSocketClient = null;
    let sampleId = null;

    // Create session and upload test sample.
    before((done) => {
        const sampleFileName = 'Sample_vcf4.1_custom_field.vcf.gz';
        const sampleFileStream = fs.createReadStream(__dirname + '/mocks/' + sampleFileName);
        const wsState = {
            operationId: null
        };

        sessionsClient.openSession(TestUser.email, (error, response) => {
            assert.ifError(error);
            sessionId = SessionsClient.getSessionFromResponse(response, true, true);

            webSocketClient = new WebSocketClient('localhost', Config.port);
            console.log('Waiting for the socket client to init...');
            setTimeout(() => {

                webSocketClient.onMessage((message) => {
                    console.log('Upload Message: ', message);
                    assert.equal(message.operationId, wsState.operationId);
                    const result = message.result;
                    if (result && result.status === 'ready') {
                        assert.equal(result.progress, 100);

                        sampleId = result.sampleId;
                        assert.ok(sampleId);
                        done();
                    } else if (result.error) {
                        assert.fail(result.error);
                    }
                });

                webSocketClient.associateSessionIdAndUserId(sessionId);

                samplesClient.add(sessionId, sampleFileName, sampleFileStream, (error, response) => {
                    const body = ClientBase.readBodyWithCheck(error, response);
                    wsState.operationId = body.operationId;
                });
            }, 3000);
        });
    });

    after((done) => {
        sessionsClient.closeSession(sessionId, (error, response) => {
            ClientBase.readBodyWithCheck(error, response);

            done();
        });
    });

    it('should get metadata for one sample', (done) => {
        samplesClient.get(sessionId, sampleId, (error, response) => {
            const sample = ClientBase.readBodyWithCheck(error, response);
            SamplesClient.verifySampleFormat(sample, true);

            done();
        });
    });

    describe('Sample Fields', () => {
        let sample = null;
        let sampleFields = null;
        let sampleEditableFields = null;
        let sampleNonEditableFields = null;

        before((done) => {
            samplesClient.get(sessionId, sampleId, (error, response) => {
                sample = ClientBase.readBodyWithCheck(error, response);
                SamplesClient.verifySampleFormat(sample, true);

                samplesClient.getFields(sessionId, sampleId, (error, response) => {
                    sampleFields = ClientBase.readBodyWithCheck(error, response);
                    SamplesClient.verifySampleFields(sampleFields, sample);

                    const groups = _.groupBy(sampleFields, field => field.isEditable ? 'editable' : 'readonly');
                    sampleEditableFields = groups['editable'];
                    assert.ok(sampleEditableFields && sampleEditableFields.length === EditableFieldsTemplates.length);

                    sampleNonEditableFields = groups['readonly'];
                    assert.ok(sampleNonEditableFields && sampleNonEditableFields.length);

                    done();
                });
            });
        });

        it('should update editable fields', (done) => {
            const genderField = _.find(sampleEditableFields, field => field.name === 'GENDER');
            const sampleToUpdate = _.cloneDeep(sample);
            const genderFieldValue = _.find(sampleToUpdate.values, value => value.fieldId === genderField.id);
            assert.ok(genderFieldValue);

            let genderValueToSet;
            if (genderFieldValue.values && genderFieldValue.values === 'Female') {
                 genderValueToSet = 'Male';
            } else {
                genderValueToSet = 'Female';
            }

            genderFieldValue.values = genderValueToSet;

            samplesClient.update(sessionId, sampleToUpdate, (error, response) => {
                const updatedSample = ClientBase.readBodyWithCheck(error, response);
                SamplesClient.verifySampleFormat(updatedSample, true);

                const updatedGenderFieldValue = _.find(updatedSample.values, value => value.fieldId === genderField.id);
                assert.equal(updatedGenderFieldValue.values, genderValueToSet);

                done();
            })
        });

        it('should fail to update non-editable fields', (done) => {
            const altField = _.find(sampleNonEditableFields, field => field.name === 'ALT');
            assert.ok(altField);
            const sampleToUpdate = _.cloneDeep(sample);
            const altFieldValue = _.find(sampleToUpdate.values, value => value.fieldId === altField.id);
            assert.ok(altFieldValue.values === null);
            altFieldValue.values = 'Test value';
            samplesClient.update(sessionId, sampleToUpdate, (error, response) => {
                ClientBase.expectErrorResponse(error, response);

                done();
            });
        });
    });
});
