'use strict';

const _ = require('lodash');
const async = require('async');

const UserModelBase = require('./SecureModelBase');

const mappedColumns = ['id', 'name', 'rules', 'description', 'is_disabled_4copy'];

class FiltersModel extends UserModelBase {
    constructor(models) {
        super(models, 'filter', mappedColumns);
    }

    add(userId, languId, filter, callback) {
        let _filter = this._init(userId, languId, filter);

        this.db.knex.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(_filter, trx, cb);
                },
                (filterId, cb) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        description: _filter.description
                    };
                    this._insertFilterText(dataToInsert, trx, (error) => {
                        cb(error, viewId);
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
                let _filter = filter;
                _filter.originalFilterId = filterData.originalFilterId || filterData.id;
                this._add(userId, filterData.languId, _filter, callback);
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
            callback(error, this._compileFilters(filtersData));
        });
    }

    _init(userId, languId, data) {
        let _data = super._init(userId, languId, data);
        if (data.originalFilterId) {
            _data.originalFilterId = data.original_filterId;
        }
        _data.name = data.name;
        _data.rules = data.rules;
        _data.filterType = 'user';
        return _data;
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            creator: data.creator,
            name: data.name,
            rules: data.rules,
            filterType: data.filter_type
        }
        if (data.originalFilterId) {
            dataToInsert.originalFilterId = data.originalFilterId
        }
        super._insert(dataToInsert, trx, callback);
    }

    _fetch(userId, id, callback) {
        super._fetchFilter(id, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchFilter(filterId, callback) {
        this.db.knex.select()
            .from(this.baseTable)
            .innerJoin('filter_text', 'filter_text.filter_id', 'filter.id')
            .where('id', filterId)
            .exec((error, filterData) => {
                if (error) {
                    callback(error);
                } else {
                    if (viewData.length > 0) {
                        callback(null, filterData[0]);
                    } else {
                        callback(new Error('Item not found: ' + filterId));
                    }
                }
            });
    }

    _fetchUserFilters(userId, callback) {
        const _query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_filter_id isnull THEN id ELSE original_filter_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTable + ' ' +
            'INNER JOIN filter_text ON filter_text.filter_id = filter.id ' +
            'WHERE creator = \'' + userId + '\' AND is_deleted = false) T WHERE T.RN = 1';
        this.db.knex.raw(_query)
            .exec(callback((error, filtersData) => {
                callback(error, filtersData.rows);
            }));
    }

    _insertFilterText(data, trx, callback) {
        this._insertTable('filter_text', data, trx, callback);
    }

    _compileFilters(filtersData) {
        return _.map(filtersData, (filterData) => {
            return this._toJson(filterData);
        });
    }
}

module.exports = FiltersModel;
