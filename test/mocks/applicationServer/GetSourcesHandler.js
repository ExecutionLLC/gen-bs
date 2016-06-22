'use strict';

const HanderBase = require('./HandlerBase');

class GetSourcesHandler extends HandlerBase {
    constructor(services) {
        super(services);
    }
    
    get methodName() {
        return 'v1.get_sources';
    }
    
    handleCall(id, method, params, sendResultCallback, callback) {
        sendResultCallback([
            'common_no_known_medical_impact_20151201'
        ]);

        callback(null);
    }
}

