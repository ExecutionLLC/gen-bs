'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('../../ServiceBase');
const RPCProxy = require('../../../utils/RPCProxy');

const proxyProviderFunc = _.once(function () {
    // return new RPCProxy(...args);
    const args = Array.prototype.slice.call(arguments);
    const ProxyConstructor = Function.prototype.bind.apply(RPCProxy, [null].concat(args));
    return new ProxyConstructor();
});

class ApplicationServerServiceBase extends ServiceBase {
    constructor(services) {
        super(services);

        this._rpcSend = this._rpcSend.bind(this);
        this._rpcReply = this._rpcReply.bind(this);

        this.logger = this.services.logger;
        const host = this.services.config.applicationServer.host;
        const port = this.services.config.applicationServer.port;
        
        this.rpcProxy = proxyProviderFunc(host, port, this.logger, null, null, this._rpcReply)
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params, (error) => {
            if (error) {
                callback(error);
            } else {
                this.logger.info('RPC SEND: ' + operationId + ' ' + method);
                this.logger.info('Params: ' + JSON.stringify(params, null, 2));
                callback(null, operationId);
            }
        });
    }

    _rpcReply(rpcError, rpcMessage) {
        this.logger.info('RPC REPLY, error: ' + JSON.stringify(rpcError, null, 2) + ', message: ' + JSON.stringify(rpcMessage, null, 2));
        this.services.applicationServerReply.onRpcReplyReceived(rpcError, rpcMessage, (error) => {
            if (error) {
                this.logger.error('Error processing RPC reply: ' + error);
            }
        });
    }
}

module.exports = ApplicationServerServiceBase;
