'use strict';

const assert = require('assert');
const _ = require('lodash');

const RequestWrapper = require('./RequestWrapper');
const ClientBase = require('./ClientBase');

class SamplesClient extends ClientBase {
    constructor(urls) {
        super(urls);
        this.samplesUrls = this.urls.samplesUrls();
    }

    getAll(sessionId, callback) {
        RequestWrapper.get(this.samplesUrls.getAll(),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    get(sessionId, sampleId, callback) {
        RequestWrapper.get(this.samplesUrls.get(sampleId),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    getFields(sessionId, sampleId, callback) {
        RequestWrapper.get(this.urls.getSampleFields(sampleId),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    getSourcesFields(sessionId, callback) {
        RequestWrapper.get(this.urls.getSourcesFields(),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    remove(sessionId, sampleId, callback) {
        RequestWrapper.del(this.viewsUrls.remove(sampleId),
            this._makeHeaders({sessionId}), null, callback);
    }

    static verifySampleFormat(sample, shouldCheckValues) {
        assert.ok(sample.id);
        assert.ok(_.includes(['standard', 'advanced', 'user'], sample.type));
        assert.ok(sample.fileName);
        if (shouldCheckValues) {
            assert.ok(sample.values && sample.values.length);
            _.each(sample.values, sampleValue => {
                assert.ok(sampleValue.fieldId);
            });
        }
    }

    static verifySampleFields(fieldsMetadata, sampleOrNull) {
        assert.ok(fieldsMetadata && fieldsMetadata.length);
        // Should contain editable fields.
        assert.ok(_.filter(fieldsMetadata, 'isEditable', true).length);
        // Should contain mandatory fields.
        assert.ok(_.filter(fieldsMetadata, 'isMandatory', true).length);

        if (sampleOrNull) {
            const values = sampleOrNull.values;
            _.each(values, value => {
                assert.ok(_.any(fieldsMetadata, fieldMetadata => fieldMetadata.id === value.fieldId),
                'Field from sample values is not found in the fields metadata collection: ' + value.fieldId);
            });
        }
    }
}

module.exports = SamplesClient;
