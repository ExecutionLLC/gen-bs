'use strict';

const async = require('async');

const ServiceBase = require('../ServiceBase');
const RabbitMQUtils = require('../../utils/rabbitMq/RabbitMqUtils');
const {WS_INSTANCE_MESSAGE_TYPES} = require('../../utils/Enums');

/**
 * Contains interaction logic with other WS instances.
 * */
class InstancesService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        const {config, logger} = services;
        Object.assign(this, {config, logger}, {
            /**@type RabbitMQPublisher*/
            publisher: null,
            /**@type RabbitMQConsumer*/
            consumer: null
        });

        this._initConnection();
    }

    isConnected() {
        return this.publisher && this.publisher.isConnected()
            && this.consumer && this.consumer.isConnected();
    }

    broadcastSampleAdded(sessionId, userId, sampleId, callback) {
        if (!this.isConnected()) {
            callback(new Error('Not connected to the RabbitMQ.'));
            return;
        }
        
        const message = {
            type: WS_INSTANCE_MESSAGE_TYPES.SAMPLE_ADDED,
            sessionId,
            userId,
            sampleId
        };
        const {publisher} = this;
        const {instancesQueue} = this.config.rabbitMq;
        publisher.publishToQueue(instancesQueue, message, callback);
    }

    _onMessage(messageObject) {
        const {type} = messageObject;
        switch (type) {
            case WS_INSTANCE_MESSAGE_TYPES.SAMPLE_ADDED:
                // TODO: generate event.
                break;
            default:
                this.logger.error(`No handler is registered for messages of type: ${type}`);
        }
    }

    _initConnection() {
        const {host, reconnectTimeout, instancesQueue} = this.config.rabbitMq;
        setInterval(() => {
            async.waterfall([
                (callback) => RabbitMQUtils.createConnection(host, callback),
                (connection, callback) => {
                    async.series({
                        publisher: (callback) => RabbitMQUtils.createPublisher(connection, logger, null, callback),
                        consumer: (callback) => RabbitMQUtils.createConsumer(connection, logger, instancesQueue,
                            null, null, true, callback)
                    }, callback)
                },
                (context, callback) => {
                    Object.assign(this, context);
                    callback(null);
                },
                (callback) => {
                    this.consumer.onMessage(this._onMessage);
                    callback(null);
                }
            ], (error) => {
                if (error) {
                    this.logger.error(`Error connecting to RabbitMQ: ${error}`)
                }
            })
        }, reconnectTimeout);
    }
}

module.exports = InstancesService;
