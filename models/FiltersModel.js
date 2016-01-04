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
        let filterData = this._init(userId, languId, filter);
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(filterData, trx, cb);
                },
                (filterId, cb) => {
                    const filterTextData = {
                        filterId: filterId,
                        languId: languId,
                        description: filterData.description
                    };
                    this._insertFilterText(filterTextData, trx, (error) => {
                        cb(error, filterId);
                    });
                }
            ], cb);
        }, callback);
    }

    _init(userId, languId, data) {
        let result = super._init(userId, languId, data);
        if (data.originalFilterId) {
            result.originalFilterId = data.originalFilterId;
        }
        result.name = data.name;
        // TODO: неверные тестовые данные!
        //result.rules = data.rules;
        result.filterType = 'user';
        return result;
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            creator: data.creator,
            name: data.name,
            // TODO: неверные тестовые данные!
            //rules: data.rules,
            filterType: data.filterType
        }
        if (data.originalFilterId) {
            dataToInsert.originalFilterId = data.originalFilterId
        }
        super._insert(dataToInsert, trx, callback);
    }

    _insertFilterText(data, trx, callback) {
        this._insertTable('filter_text', data, trx, callback);
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

    find(userId, filterId, callback) {
        this._fetch(userId, filterId, (error, filterData) => {
            callback(error, this._toJson(filterData));
        });
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
}

module.exports = FiltersModel;
