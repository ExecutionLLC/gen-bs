'use strict';

const ServiceBase = require('./ServiceBase');

class SearchService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    sendSearchRequest(viewId, filterIds, globalSearchValue,
       fieldSearchValues, limit, offset, callback) {
         // TODO: Implement search
         // 1. Get session id
         // 2. Load filters and views by id
         // 3. Form and send request
    }
}

module.exports = SearchService;
