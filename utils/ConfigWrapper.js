'use strict';

class ConfigWrapper {
    constructor() {
        var ENV = process.env;
        var defaultSettings = this.defaultSettings();

        this.settings = {
            port: ENV.PORT || defaultSettings.port,
            rpc: {
                host: ENV.WSHOST || defaultSettings.rpc.host,
                port: ENV.WSPORT || defaultSettings.rpc.port
            }
        }
    }

    defaultSettings() {
        return {
            port: 5000,
            rpc: {
                host: 'localhost',
                port: 5050
            }
        }
    }
}

module.exports = ConfigWrapper;