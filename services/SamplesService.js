'use strict';

const lodash = require('lodash');

const ServiceBase = require('./ServiceBase');

const SAMPLE_METADATA = require('../test_data/sample_metadata.json');

class SamplesService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    findAllForUser(user, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this._createMockedSample(user, SAMPLE_METADATA.id, (error, sample) => {
           if (error) {
               callback(error);
           } else {
               callback(null, [sample]);
           }
        });
    }

    findSampleForUserAndSampleId(user, sampleId, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }
        this._createMockedSample(user, sampleId, callback);
    }

    _createMockedSample(user, sampleId, callback) {
        this.services.fieldsMetadata.findForUserBySampleId(user, sampleId, (error, fieldMetadata) => {
            if (error) {
                callback(error);
            } else {
                const sample = lodash.cloneDeep(SAMPLE_METADATA);
                sample.fields = fieldMetadata;
                callback(null, sample);
            }
        });
    }
}

module.exports = SamplesService;
