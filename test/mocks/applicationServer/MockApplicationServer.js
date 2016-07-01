'use strict';

const _ = require('lodash');
const async = require('async');

const RpcRouter = require('./RpcRouter');

const SearchHandler = require('./SearchHandler');
const RabbitMqUtils = require('../../../utils/RabbitMqUtils');

class MockApplicationServer {
    constructor(services, rabbitMqHost) {
        Object.assign(this, {
            services,
            config: services.config,
            logger: services.logger,
            router: new RpcRouter(),
            rabbitMqHost
        });

        this._sendResultToClients = this._sendResultToClients.bind(this);
        this.onClientMessage = this.onClientMessage.bind(this);

        const searchHandler = new SearchHandler(services);

        this.router.registerHandler(searchHandler);
    }

    start(callback) {
        const address = RabbitMqUtils.createAddress(this.rabbitMqHost);
        const {requestQueueName} = this.config.rabbitMq;
        async.waterfall([
            (callback) => RabbitMqUtils.createContext(address, requestQueueName, {
                onError: this._onError,
                onClose: this._onClose
            }, callback),
            (rabbitContext, callback) => RabbitMqUtils.setRequestQueryHandler(
                rabbitContext,
                this.onClientMessage,
                false,
                (error) => callback(error, rabbitContext)
            ),
            (rabbitContext, callback) => {
                this.rabbitContext = rabbitContext;
                callback(null);
            }
        ], callback);
    }

    /**
     * @param {string}messageString
     * */
    onClientMessage(messageString) {
        try {
            const message = JSON.parse(messageString);
            this.router.handleCall(message, this._sendResultToClients);
        } catch (e) {
            console.error(`Error parsing message: ${messageString}`);
        }
    }

    stop(callback) {
        if (this.rabbitContext) {
            RabbitMqUtils.freeContext(this.rabbitContext, callback);
        }
    }

    _onError(error) {
        console.error(`RabbitMQ channel error: ${error}`);
    }

    _onClose() {
        console.error('RabbitMQ channel is closed.');
    }

    /**
     * @param {Object}result
     * */
    _sendResultToClients(result) {
        const resultString = JSON.stringify(result);
        this.webSocketServerProxy.sendToAll(resultString);
    }
}

module.exports = MockApplicationServer;
