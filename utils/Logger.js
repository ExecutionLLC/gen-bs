'use strict';

const _ = require('lodash');
const bunyan = require('bunyan');
const colors = require('colors/safe');

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

class ConsoleStream {
    write(recordString) {
        const record = JSON.parse(recordString);
        const isErrorMessage = record.level > 30;
        const outputFunc = isErrorMessage ? console.error : console.log;
        const timeString = colors.cyan(record.time);
        const levelString = bunyan.nameFromLevel[record.level];
        const levelFormattedString = colors.bold(isErrorMessage ? colors.red(levelString) : colors.green(levelString));

        outputFunc(
            '[%s] %s: %s',
            timeString,
            levelFormattedString,
            record.msg
        );
    }
}

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
                stream: new ConsoleStream(),
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
            metadata = {metadata};
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
