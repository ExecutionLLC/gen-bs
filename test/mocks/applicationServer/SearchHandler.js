'use strict';

const assert = require('assert');
const async = require('async');

const HandlerBase = require('./HandlerBase');
const mockData = require('./data/redis-data.json');

const STATUSES = {
    sample_loading: 'sample_loading',
    view_building: 'view_building',
    view_filtering: 'view_filtering',
    view_loading: 'view_loading',
    view_updating: 'view_updating',
    ready: 'ready'
};

let databaseNumber = 2;

class SearchHandler extends HandlerBase {
    constructor(services) {
        super(services);
    }

    get methodName() {
        return 'v1.open_session';
    }

    handleCall(id, method, params, sendResultCallback, callback) {
        const {sample, view_structure, view_filter, view_sort_order} = params;
        [sample, view_structure, view_filter, view_sort_order].forEach(item => assert.ok(item));

        const openSessionProgress = {
            id,
            sessionState: {
                progress: 0,
                status: STATUSES.sample_loading,
                sort_order: [],
                view_structure,
                view_filter,
                view_sort_order,
                global_filter: {}
            }
        };

        sendResultCallback(openSessionProgress);
        sendResultCallback(Object.assign({}, openSessionProgress, {
            sessionState: {
                progress: 33,
                status: STATUSES.view_building
            }
        }));
        sendResultCallback(Object.assign({}, openSessionProgress, {
            sessionState: {
                progress: 66,
                status: STATUSES.view_loading
            }
        }));

        let redisParams = {
            host: 'localhost',
            number: databaseNumber,
            password: null,
            port: 6379,
            result_index: 'index:final'
        };
        let data = []
        async.waterfall([
            (callback) => {
                sendResultCallback(Object.assign({}, openSessionProgress, {
                    sessionState: {
                        progress: 100,
                        status: STATUSES.ready,
                        data
                    }
                }));
                callback(null);
            }
        ], callback);
    }
}

module.exports = SearchHandler;
