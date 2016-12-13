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
        if (!sample.id || !sample.fileName) { // TODO 757: removeisValidSample if did not used
            return false;
        }
        if (!_.includes([entityType.DEFAULT, entityType.STANDARD, entityType.ADVANCED, entityType.USER], sample.type)) {
            return false;
        }
        if (shouldCheckFieldValues) {
            if (!sample.sampleFields || !sample.sampleFields.length) {
                return false;
            }
            if (_.any(sample.sampleFields, sampleValue => !sampleValue.fieldId)) {
                return false;
            }
        }

        return true;
    }
}
