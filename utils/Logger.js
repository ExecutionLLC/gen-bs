var _ = require('lodash');

var bunyan = require('bunyan');
var path   = require('path');

var levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

var Logger = module.exports = function(params) {
    var self = this;

    this.bunyan = null;
    this.filter = [];
    this.init(params);
};

Logger.consoleLogger = function() {
    return _.reduce(levels, function(logger, level) {
        logger[level] = console.log.bind(console);
        return logger;
    }, {});
};

Logger.nullLogger = function() {
    return _.reduce(levels, function(logger, level) {
        logger[level] = function() {};
        return logger;
    }, {});
};

Logger.prototype.prepareMetadata = function(metadata) {
    if (!metadata) metadata = {};

    if (typeof metadata !== 'object') {
        metadata = {metadata: metadata};
    }

    return metadata;
};

Logger.prototype.close = function() {
    for (var stream_id in this.bunyan.streams) {
        var s = this.bunyan.streams[stream_id];
        if (s.closeOnExit) {
            s.stream.end();
        }
    }
};

Logger.prototype.init = function(params) {
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
};

_.each(levels, function(level) {
    Logger.prototype[level] = function(message, metadata) {
        this.bunyan[level](this.prepareMetadata(metadata), message);
    };
});