'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

const DEFAULT_NAME_FILTER = '';
const DEFAULT_DESCRIPTION_FILTER = '';

class AnalysisService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.analysis);
    }

    findAll(user, limit, offset, nameFilter = DEFAULT_NAME_FILTER,
            descriptionFilter = DEFAULT_DESCRIPTION_FILTER, callback) {
        if (this.services.users.isDemoUserId(user.id)) {
            // Demo users have no history.
            callback(null, []);
        } else {
            this.models.analysis.findAll(
                user.id, limit, offset, nameFilter, descriptionFilter, callback
            );
        }
    }

    add(user, languageId, text, type, viewId, filterId, modelId, samples, callback) {
        if (this.services.users.isDemoUserId(user.id)) {
            callback(null, null);
        } else {
            if (name) {
                const newAnalysis = {
                    creator: user.id,
                    name,
                    text,
                    type,
                    viewId,
                    filterId,
                    modelId,
                    samples
                };
                super.add(user, languageId, newAnalysis, callback)
            } else {
                callback(new Error('Analysis name can not be empty'), null);
            }
        }
    }

    update(user, item, callback) {
        if (this.services.users.isDemoUserId(user.id)) {
            callback(null, []);
        } else if (item.name) {
            async.waterfall([
                (callback) => {
                    this.models.analysis.find(user.id, item.id, callback)
                },
                (analysys, callback) => {
                    const newAnalysis = Object.assign({}, analysys, {
                        name: item.name,
                        description: item.description,
                        lastQueryDate: item.lastQueryDate
                    });
                    super.update(user, newAnalysis, callback)
                }
            ], callback);
        } else {
            callback(new Error('Analysis name can not be empty'), null);
        }
    }
}

module.exports = AnalysisService;