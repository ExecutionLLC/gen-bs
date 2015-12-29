'use strict';

const _ = require('lodash');

const bunyan = require('bunyan');
const path   = require('path');
const domain = require('domain');

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

class Logger {
    constructor(params) {
        this.bunyan = null;
        this.filter = [];
        this._init(params);
    }

    consoleLogger() {
        return _.reduce(levels, (logger, level) => {
            logger[level] = console.log.bind(console);
            return logger;
        }, {});
    }

    nullLogger() {
        return _.reduce(levels, (logger, level) => {
            logger[level] = () => {};
            return logger;
        }, {});
    }

    _prepareFileName(filename) {
        return path.normalize(path.join(__dirname, "..", filename));
    }

    _prepareMetadata(metadata) {
        if (!metadata) metadata = {};

        if (typeof metadata !== 'object') {
            metadata = {metadata: metadata};
        }

        if (domain.active) {
            if (domain.active.client_ip) {
                metadata.ip = domain.active.client_ip;
            }
            if (!domain.active.in_request && domain.active.request_url) {
                _.extend(metadata, domain.active.post_params || {});
                metadata.url = domain.active.request_url;
                domain.active.in_request = true;
            }
        }
        return metadata;
    }

    close() {
        for (let stream_id in this.bunyan.streams) {
            var stream = this.bunyan.streams[stream_id];
            if (stream.closeOnExit) {
                stream.stream.end();
            }
        }
    }

    _init(params) {
        let streams = [];

        if (params.console) {
            streams.push({
                stream: process.stdout,
                level:  params.console.level || "trace"
            });
        }

        if (params.file) {
            streams.push({
                path:   this._prepareFileName(params.file.path || "logs/server.log"),
                level:  params.file.level || "trace"
            });
        }

        this.filter_params = params['filter_params'] || [];
        this.bunyan = bunyan.createLogger({
            name: params['app_name'],
            streams: streams
        });
    }
}

_.each(levels, (level) => {
    Logger.prototype[level] = (message, metadata) => {
        this.bunyan[level](this.prepareMetadata(metadata), message);
    };
});

module.exports = Logger;