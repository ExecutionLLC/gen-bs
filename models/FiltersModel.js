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
                        // TODO: неверные тестовые данные!
                        // rules: filter.rules,
                        filterType: 'user'
                    };
                    if (filter.originalFilterId) {
                        dataToInsert.originalFilterId = filter.originalFilterId;
                    }
                    this._insert(dataToInsert, trx, cb);
                },
                (filterId, cb) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        description: filter.description
                    };
                    this._insertTable('filter_text', dataToInsert, trx, (error, result) => {
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
                let newFilter = filter;
                newFilter.originalFilterId = filterData.originalFilterId || filterData.id;
                this.add(userId, filterData.languId, newFilter, callback);
            }
        });
    }

    find(userId, filterId, callback) {
        this._fetch(userId, filterId, (error, filterData) => {
            callback(error, this._toJson(filterData));
        });
    }

    // Собирает последние версии каждого filter для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserFilters(userId, (error, filtersData) => {
            if (error) {
                callback(error);
            } else {
                async.map(filtersData, (filterData, cb) => {
                    cb(null, this._toJson(filterData));
                }, callback);
            }
        });
    }

    _fetch(userId, id, callback) {
        this._fetchFilter(id, (error, data) => {
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
                .from(this.baseTable)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTable + '.id')
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

    _fetchUserFilters(userId, callback) {
        const query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_filter_id isnull THEN id ELSE original_filter_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTable + ' ' +
            'INNER JOIN filter_text ON filter_text.filter_id = ' + this.baseTable + '.id ' +
            'WHERE creator = \'' + userId + '\' AND is_deleted = false) T WHERE T.RN = 1';
        this.db.asCallback((knex, cb) => {
            knex.raw(query)
                .asCallback((error, viewsData) => {
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
