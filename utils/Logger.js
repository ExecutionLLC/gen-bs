'use strict';

const _ = require('lodash');
const bunyan = require('bunyan');
const path   = require('path');

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

class Logger {
    constructor(params) {
        this.bunyan = null;
        this.filter = [];
        this._init(params);
    }

    _init(params) {
        var streams = [];

        if (params.console) {
            streams.push({
                stream: process.stdout,
                level:  params.console.level || "trace"
            });
        }

        if (params.file) {
            streams.push({
                path:   params.file.path,
                level:  params.file.level || "trace"
            });
        }

        this.filter_params = params['filter_params'] || [];
        this.bunyan = bunyan.createLogger({
            name: params['app_name'],
            streams: streams
        });
    }

    _writeMessage(level, message, metadata) {
        this.bunyan[level](this._prepareMetadata(metadata), message);
    }

    _prepareMetadata(metadata) {
        if (!metadata) metadata = {};

        if (typeof metadata !== 'object') {
            metadata = {metadata: metadata};
        }

        return metadata;
    }

    close() {
        _
            .filter(this.bunyan.streams, stream => stream.closeOnExit)
            .forEach(stream => stream.stream.end());
    }
}

/**
 * Generate methods for each of available log levels.
 * */
_.each(LEVELS, (level) => {
    Logger.prototype[level] = function(message, metadata) {
        this._writeMessage(level, message, metadata);
    };
});

module.exports = Logger;
