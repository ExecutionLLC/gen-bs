'use strict';

import _ from 'lodash';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';

export default class SamplesClient extends UserEntityClientBase {
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

    getAllFields(sessionId, callback) {
        RequestWrapper.get(this.urls.getAllFields(),
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

    static isValidSample(sample, shouldCheckFieldValues) {
        if (!sample.id || !sample.fileName) {
            return false;
        }
        if (!_.includes(['standard', 'advanced', 'user'], sample.type)) {
            return false;
        }
        if (shouldCheckFieldValues) {
            if (!sample.values || !sample.values.length) {
                return false;
            }
            if (_.any(sample.values, sampleValue => !sampleValue.fieldId)) {
                return false;
            }
        }

        return true;
    }

    static isValidSampleMetadata(fieldsMetadata, sampleOrNull) {
        if (!fieldsMetadata || !fieldsMetadata.length) {
            return false;
        }
        // Should contain editable fields.
        if (!_.filter(fieldsMetadata, 'isEditable', true).length) {
            return false;
        }
        // Should contain mandatory fields.
        if (!_.filter(fieldsMetadata, 'isMandatory', true).length) {
            return false;
        }

        if (sampleOrNull) {
            const values = sampleOrNull.values;
            return _.filter(
                values, 
                value => !_.any(fieldsMetadata, fieldMetadata => fieldMetadata.id === value.fieldId)
            );
        }
        return true;
    }
}
