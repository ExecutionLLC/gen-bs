'use strict';

const assert = require('assert');
const _ = require('lodash');

const {ENTITY_TYPES} = require('../../utils/Enums');
const RequestWrapper = require('./RequestWrapper');
const UserEntityClientBase = require('./UserEntityClientBase');

class SamplesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.samplesUrls());
    }

    getFields(sessionId, sampleId, callback) {
        RequestWrapper.get(this.urls.getSampleFields(sampleId),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    getSourcesFields(sessionId, callback) {
        RequestWrapper.get(this.urls.getSourcesFields(),
            this._makeHeaders({sessionId}), null, null, callback);
    }

    add(sessionId, fileName, fileStream, callback) {
        RequestWrapper.upload(this.collectionUrls.upload(),
            'sample',
            fileName,
            fileStream,
            this._makeHeaders({sessionId}),
            {},
            callback
        );
    }

    static verifySampleFormat(sample, shouldCheckFieldValues) {
        assert.ok(sample.id);
        assert.ok(_.includes(ENTITY_TYPES.allValues, sample.type));
        assert.ok(sample.fileName);
        if (shouldCheckFieldValues) {
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
                assert.ok(_.some(fieldsMetadata, fieldMetadata => fieldMetadata.id === value.fieldId),
                'Field from sample values is not found in the fields metadata collection: ' + value.fieldId);
            });
        }
    }
}

module.exports = SamplesClient;
