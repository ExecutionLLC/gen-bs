'use strict';

class ConfigWrapper {
    constructor() {
        var ENV = process.env;

        this.settings = {
            port: ENV.PORT || 5000,
            applicationServer: {
                host: ENV.AS_HOST || '192.168.1.102',
                port: ENV.AS_WS_PORT || 8888
            }
        }
    }
}

module.exports = ConfigWrapper;