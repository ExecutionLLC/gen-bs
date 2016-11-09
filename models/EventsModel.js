const async = require('async');

const {ENTITY_TYPES} = require('../utils/Enums');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');
const ModelBase = require('./ModelBase');

const TableNames = {
    UserEvents: 'user_event'
};

const mappedColumns = [
    'id',
    'type',
    'timestamp',
    'creator'
];

class EventsModel extends ModelBase {
    constructor(models) {
        super(models, TableNames.UserEvents, mappedColumns);
    }

    add(userId, item, callback) {
        async.waterfall([
            (callback) => this._add(userId, item, true, callback),
            (itemId, callback) => this.find(itemId, callback)
        ], callback);
    }

    _add(userId, event, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            const dataToInsert = {
                id: shouldGenerateId ? this._generateId() : event.id,
                creator: userId,
                timestamp: event.timestamp || new Date(),
                type: event.type
            };
            this._insert(dataToInsert, trx, callback);
        }, callback);
    }
}
module.exports = EventsModel;