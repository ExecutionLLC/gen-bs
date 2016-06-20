'use strict';

const assert = require('assert');

const STATUSES = {
    sample_loading: 'sample_loading',
    view_building: 'view_building',
    view_filtering: 'view_filtering',
    view_loading: 'view_loading',
    view_updating: 'view_updating',
    ready: 'ready'
};

function handleCall(id, method, params, sendResultCallback) {
    const {sample, view_structure, view_filter, view_sort_order} = params;
    [sample, view_structure, view_filter, view_sort_order].forEach(item => assert.ok(item));

    const openSessionProgress = {
        id,
        result: {
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
        result: {
            progress: 33,
            status: STATUSES.view_building
        }
    }));
    sendResultCallback(Object.assign({}, openSessionProgress, {
        result: {
            progress: 66,
            status: STATUSES.view_loading
        }
    }));
    sendResultCallback(Object.assign({}, openSessionProgress, {
        result: {
            progress: 100,
            status: STATUSES.ready,
            redis_db: {
                host: 'localhost',
                number: 5,
                password: null,
                port: 6379,
                result_index: 'index:final'
            }
        }
    }));
}

module.exports = {
    methodName: 'v1.open_session',
    handleCall
};
