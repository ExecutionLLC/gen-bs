const ampq = require('amqplib');
const AmpqConnectionClosed = require('./AmpqConnectionClosed');

class AmpqConnection {

    constructor(logger, host, port, user, password, virtualHost) {
        this._logger = logger;
        this._url = this._createAddress(host, port, user, password, virtualHost);
        this._ampqConnection = null;
    }

    get logger() {
        return this._logger;
    }

    get isOpen() {

    }

    get _connection() {
        if (this._ampqConnection) {
            throw new AmpqConnectionClosed();
        }
        return this._ampqConnection
    }

    open(callback) {
        this.logger.info('Open new connection');
        if (this.isOpen) {
            this.logger.warning('Connection already opened');
            callback(null)
        } else {
            this._open(callback);
        }
    }

    close() {
        this._connection.close();
    }

    _open(callback) {
        ampq.connect(this._url, (err, connection) => {
            if (err) {
                this.logger.error(`Connection failed: ${err}`);
                callback(err);
            }

            connection.on("error", (err) => {
                this.logger.error(`Connection error: ${err}`);
                callback(err);
            });
            this.logger.info('Ampq connection opened');
            this._ampqConnection = connection;
            callback(null);
        });
    }

    static _createAddress(host, port, user, password, virtualHost) {
        return `amqp://${user}:${password}@${host}:${port}/${virtualHost}`;
    }
}

module.exports = AmpqConnection;