'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'original_filter_id',
    'name',
    'rules',
    'filter_type',
    'is_deleted',
    'langu_id',
    'description'
];

class FiltersModel extends SecureModelBase {
    constructor(models) {
        super(models, 'filter', mappedColumns);
    }

    add(userId, languId, filter, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        name: filter.name,
                        rules: filter.rules,
                        filterType: 'user'
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (filterId, cb) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        description: filter.description
                    };
                    this._insertIntoTable('filter_text', dataToInsert, trx, (error, result) => {
                        cb(error, filterId);
                    });
                }
            ], cb);
        }, callback);
    }

    // Создаёт новую версию существующего filter
    update(userId, filterId, filter, callback) {
        this._fetch(userId, filterId, (error, filterData) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToInsert = {
                                id: this._generateId(),
                                creator: userId,
                                name: filter.name,
                                rules: filter.rules,
                                filterType: filter.filterType,
                                originalFilterId: filterData.originalfilterId || filterData.id
                            };
                            this._insert(dataToInsert, trx, cb);
                        },
                        (filterId, cb) => {
                            const dataToInsert = {
                                filterId: filterId,
                                languId: filterData.languId,
                                description: filter.description
                            };
                            this._insertIntoTable('filter_text', dataToInsert, trx, (error) => {
                                cb(error, filterId);
                            });
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, filterId, callback) {
        this._fetch(userId, filterId, (error, filterData) => {
            callback(error, this._mapColumns(filterData));
        });
    }

    // Собирает последние версии каждого filter для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserFilters(userId, (error, filtersData) => {
            if (error) {
                callback(error);
            } else {
                async.map(filtersData, (filterData, cb) => {
                    cb(null, this._mapColumns(filterData));
                }, callback);
            }
        });
    }

    findMany(userId, filterIds, callback) {
        async.waterfall([
            (cb) => { this._fetchFilters(filterIds, cb); },
            (filtersData, cb) => {
                if (filtersData.length == filterIds.length) {
                    cb(null, filtersData);
                } else {
                    cb('Inactive filters found: ' + filterIds + ', userId: ' + userId);
                }
            },
            (filtersData, cb) => {
                if (_.every(filtersData, 'creator', userId)) {
                    cb(null, filtersData);
                } else {
                    cb('Unauthorized filters: ' + filterIds + ', userId: ' + userId);
                }
            },
            (filtersData, cb) => {
                async.map(filtersData, (filterData, cb) => {
                    cb(null, this._mapColumns(filterData));
                }, cb);
            }
        ], callback);
    }

    _fetch(userId, filterId, callback) {
        this._fetchFilter(filterId, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchFilter(filterId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTableName + '.id')
                .where('id', filterId)
                .asCallback((error, filterData) => {
                    if (error) {
                        cb(error);
                    } else {
                        if (filterData.length > 0) {
                            cb(null, ChangeCaseUtil.convertKeysToCamelCase(filterData[0]));
                        } else {
                            cb(new Error('Item not found: ' + filterId));
                        }
                    }
            });
        }, callback);
    }

    _fetchFilters(filterIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTableName + '.id')
                .whereIn('id', filterIds)
                .asCallback((error, filtersData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(filtersData));
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
            'WHERE (creator = \'' + userId + '\' OR WHERE creator IS NULL) AND is_deleted = false) T WHERE T.RN = 1';
        this.db.asCallback((knex, cb) => {
            knex.raw(query)
                .asCallback((error, filtersData) => {
                if (error) {
                    cb(error);
                } else {
                    cb(null, ChangeCaseUtil.convertKeysToCamelCase(filtersData));
                }
            });
        }, callback);
    }
}

module.exports = FiltersModel;
