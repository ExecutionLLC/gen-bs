var _ = require('lodash');

var bunyan = require('bunyan');
var path   = require('path');
var domain = require('domain');

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

Logger.prototype.prepareFileName = function(filename) {
    return path.normalize(path.join(__dirname, "..", filename));
};

Logger.prototype.prepareMetadata = function(metadata) {
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
};

Logger.prototype.close = function() {
    for (var stream_id in this.bunyan.streams) {
        var stream = this.bunyan.streams[stream_id];
        if (stream.closeOnExit) {
            stream.stream.end();
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
            path:   this.prepareFileName(params.file.path || "logs/server.log"),
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