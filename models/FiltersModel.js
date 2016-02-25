'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'originalFilterId',
    'name',
    'rules',
    'type',
    'isDeleted',
    'isCopyDisabled',
    'languId',
    'description'
];

class FiltersModel extends SecureModelBase {
    constructor(models) {
        super(models, 'filter', mappedColumns);
    }

    // It collects the latest version of each filter for the current user
    findAll(userId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchUserFilters(userId, callback);
            },
            (filtersData, callback) => {
                async.map(filtersData, (filterData, callback) => {
                    callback(null, this._mapColumns(filterData));
                }, callback);
            }
        ], callback);
    }

    findMany(userId, filterIds, callback) {
        async.waterfall([
            (callback) => { this._fetchFilters(filterIds, callback); },
            (filtersData, callback) => {
                if ((filtersData.length == filterIds.length) && (_.every(filtersData, 'isDeleted', false))) {
                    callback(null, filtersData);
                } else {
                    callback('Some filters not found: ' + filterIds + ', userId: ' + userId);
                }
            },
            (filtersData, callback) => {
                if (_.every(filtersData, 'creator', userId)) {
                    callback(null, filtersData);
                } else {
                    callback('Unauthorized access to filters: ' + filterIds + ', userId: ' + userId);
                }
            },
            (filtersData, callback) => {
                async.map(filtersData, (filterData, callback) => {
                    callback(null, this._mapColumns(filterData));
                }, callback);
            }
        ], callback);
    }

    _add(userId, languId, filter, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : filter.id,
                        creator: userId,
                        name: filter.name,
                        rules: filter.rules,
                        type: filter.type || 'user'
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        description: filter.description
                    };
                    this._unsafeInsert('filter_text', dataToInsert, trx, (error) => {
                        callback(error, filterId);
                    });
                }
            ], callback);
        }, callback);
    }

    // It creates a new version of an existing filter
    _update(userId, filter, filterToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        name: filterToUpdate.name,
                        rules: filterToUpdate.rules,
                        type: filter.type,
                        originalFilterId: filter.originalFilterId || filter.id
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: filter.languId,
                        description: filterToUpdate.description
                    };
                    this._unsafeInsert('filter_text', dataToInsert, trx, (error) => {
                        callback(error, filterId);
                    });
                }
            ], callback);
        }, callback);
    }

    _fetch(userId, filterId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchFilter(filterId, callback);
            },
            (filter, callback) => {
                this._checkUserIsCorrect(userId, filter, callback);
            }
        ], callback);
    }

    _fetchFilter(filterId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTableName + '.id')
                .where('id', filterId)
                .asCallback((error, filterData) => {
                    if (error || !filterData.length) {
                        callback(error || new Error('Item not found: ' + filterId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filterData[0]));
                    }
            });
        }, callback);
    }

    _fetchFilters(filterIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTableName + '.id')
                .whereIn('id', filterIds)
                .asCallback((error, filtersData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filtersData));
                    }
                });
        }, callback);
    }

    _fetchUserFilters(userId, callback) {
        const query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_filter_id isnull THEN id ELSE original_filter_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTableName + ' ' +
            'INNER JOIN filter_text ON filter_text.filter_id = ' + this.baseTableName + '.id ' +
            'WHERE (creator = \'' + userId + '\' OR creator IS NULL) AND is_deleted = false) T WHERE T.RN = 1';
        this.db.asCallback((knex, callback) => {
            knex.raw(query)
                .asCallback((error, filtersData) => {
                if (error) {
                    callback(error);
                } else {
                    callback(null, ChangeCaseUtil.convertKeysToCamelCase(filtersData.rows));
                }
            });
        }, callback);
    }
}

module.exports = FiltersModel;
