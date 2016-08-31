'use strict';

import _ from 'lodash';

import RequestWrapper from './RequestWrapper';
import UserEntityClientBase from './UserEntityClientBase';
import {entityType} from '../utils/entityTypes';

export default class SamplesClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.samplesUrls());
    }

    getFields(sampleId, callback) {
        RequestWrapper.get(this.urls.getSampleFields(sampleId), null, null, null, callback);
    }

    getSourcesFields(callback) {
        RequestWrapper.get(this.urls.getSourcesFields(), null, null, null, callback);
    }

    getAllFields(callback) {
        RequestWrapper.get(this.urls.getAllFields(), null, null, null, callback);
    }

    add(fileName, fileStream, callback) {
        RequestWrapper.upload(this.collectionUrls.upload(),
            'sample',
            fileName,
            fileStream,
            null,
            {},
            callback
        );
    }

    static isValidSample(sample, shouldCheckFieldValues) {
        if (!sample.id || !sample.fileName) {
            return false;
        }
        if (!_.includes([entityType.DEFAULT, entityType.STANDARD, entityType.ADVANCED, entityType.USER], sample.type)) {
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
        if (!_.filter(fieldsMetadata, ['isEditable', true]).length) {
            return false;
        }
        // Should contain mandatory fields.
        if (!_.filter(fieldsMetadata, ['isMandatory', true]).length) {
            return false;
        }

        if (sampleOrNull) {
            const values = sampleOrNull.values;
            return !!_.filter(
                values,
                value => !_.any(fieldsMetadata, fieldMetadata => fieldMetadata.id === value.fieldId)
            );
        }
        return true;
    }
}
